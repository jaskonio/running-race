import prisma from "@/lib/prisma";
import { getChallengeStart, getChallengeEnd, formatDate } from "@/lib/date";
import { ensureValidToken, refreshAccessToken } from "./strava-auth-service";
import {
  fetchActivities,
  filterRunningActivities,
  metersToKm,
} from "./strava-activity-service";

const CHALLENGE_START = getChallengeStart();
const CHALLENGE_END = getChallengeEnd();

/**
 * Update participant tokens in the database
 */
async function updateParticipantTokens(
  id: string,
  data: {
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date;
  }
): Promise<void> {
  await prisma.participant.update({
    where: { id },
    data,
  });
}

/**
 * Sync a single participant's activities from Strava
 */
export async function syncParticipant(
  participant: {
    id: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date;
    isActive: boolean;
  }
): Promise<{
  success: boolean;
  activitiesFetched: number;
  activitiesStored: number;
  errorMessage?: string;
}> {
  // Create SyncRun record
  const syncRun = await prisma.syncRun.create({
    data: {
      participantId: participant.id,
      status: "running",
      startedAt: new Date(),
    },
  });

  console.log(`[sync][${participant.name}] Starting sync (syncRun=${syncRun.id})`);

  try {
    // Ensure token is valid
    console.log(`[sync][${participant.name}] Checking token (expires=${participant.tokenExpiresAt.toISOString()})...`);
    let accessToken = await ensureValidToken(participant, updateParticipantTokens);
    console.log(`[sync][${participant.name}] Token valid`);

    // Fetch activities from Strava (with retry on 401)
    console.log(
      `[sync][${participant.name}] Fetching activities from Strava ` +
      `(after=${CHALLENGE_START.toISOString()}, before=${CHALLENGE_END.toISOString()})...`
    );

    let allActivities;
    try {
      allActivities = await fetchActivities(accessToken, CHALLENGE_START, CHALLENGE_END);
    } catch (fetchError: unknown) {
      const fetchErrorMsg = fetchError instanceof Error ? fetchError.message : "Unknown error";

      // If 401, force a token refresh and retry once
      if (fetchErrorMsg.includes("401")) {
        console.log(
          `[sync][${participant.name}] Got 401 from Strava — forcing token refresh and retrying...`
        );
        const tokenResponse = await refreshAccessToken(participant.refreshToken);
        accessToken = tokenResponse.access_token;

        await updateParticipantTokens(participant.id, {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          tokenExpiresAt: new Date(tokenResponse.expires_at * 1000),
        });

        console.log(
          `[sync][${participant.name}] Token refreshed — retrying fetch...`
        );
        allActivities = await fetchActivities(accessToken, CHALLENGE_START, CHALLENGE_END);
      } else {
        throw fetchError;
      }
    }

    console.log(`[sync][${participant.name}] Fetched ${allActivities.length} total activities from Strava`);

    // Log activity types for debugging
    const sportTypes = [...new Set(allActivities.map((a) => a.sport_type || a.type))];
    console.log(`[sync][${participant.name}] Sport types found: ${sportTypes.join(", ")}`);

    // Filter: only running activities within challenge dates
    const runningActivities = filterRunningActivities(
      allActivities,
      CHALLENGE_START,
      CHALLENGE_END
    );
    console.log(
      `[sync][${participant.name}] Filtered to ${runningActivities.length} running activities ` +
      `(from ${allActivities.length} total)`
    );

    if (runningActivities.length === 0) {
      console.log(`[sync][${participant.name}] No running activities to process`);
    }

    let activitiesStored = 0;

    // Process each activity
    for (const activity of runningActivities) {
      const activityDate = new Date(activity.start_date);
      const km = metersToKm(activity.distance);

      console.log(
        `[sync][${participant.name}] Processing: "${activity.name}" ` +
        `date=${activityDate.toISOString()} km=${km} ` +
        `sport=${activity.sport_type || activity.type}`
      );

      // Upsert activity (dedup via stravaActivityId)
      await prisma.activity.upsert({
        where: { stravaActivityId: String(activity.id) },
        create: {
          participantId: participant.id,
          stravaActivityId: String(activity.id),
          name: activity.name,
          sportType: activity.sport_type,
          distanceKm: km,
          movingTimeSec: activity.moving_time,
          elapsedTimeSec: activity.elapsed_time,
          startDate: activityDate,
          activityDate: new Date(
            activityDate.getFullYear(),
            activityDate.getMonth(),
            activityDate.getDate()
          ),
        },
        update: {
          name: activity.name,
          distanceKm: km,
          movingTimeSec: activity.moving_time,
          elapsedTimeSec: activity.elapsed_time,
        },
      });

      activitiesStored++;
    }

    // Recalculate daily distances for all dates this participant has activities
    console.log(`[sync][${participant.name}] Recalculating daily distances...`);
    await recalculateDailyDistances(participant.id);

    // Update SyncRun as completed
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        activitiesFetched: allActivities.length,
        activitiesStored,
      },
    });

    console.log(
      `[sync][${participant.name}] ✅ Sync complete: ` +
      `fetched=${allActivities.length}, stored=${activitiesStored}`
    );

    return {
      success: true,
      activitiesFetched: allActivities.length,
      activitiesStored,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(
      `[sync][${participant.name}] ❌ Sync failed: ${errorMessage}`,
      error instanceof Error ? error.stack : ""
    );

    // Check if it's a token refresh failure — log but do NOT deactivate
    // The participant can be reconnected via the Strava OAuth button
    if (errorMessage.includes("401") || errorMessage.includes("refresh")) {
      console.error(
        `[sync][${participant.name}] Token issue detected — participant needs to reconnect via Strava OAuth button`
      );
    }

    // Update SyncRun as failed
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorMessage,
      },
    });

    return {
      success: false,
      activitiesFetched: 0,
      activitiesStored: 0,
      errorMessage,
    };
  }
}

/**
 * Recalculate daily distances for a participant
 * Sums all activities per date and upserts DailyDistance records
 */
async function recalculateDailyDistances(participantId: string): Promise<void> {
  // Get all activities grouped by date
  const activities = await prisma.activity.findMany({
    where: { participantId },
    select: { activityDate: true, distanceKm: true },
  });

  // Group by date and sum distances
  const dailyMap = new Map<string, number>();

  for (const activity of activities) {
    const dateKey = formatDate(activity.activityDate);
    const current = dailyMap.get(dateKey) || 0;
    dailyMap.set(dateKey, current + activity.distanceKm);
  }

  // Upsert daily distances
  for (const [dateStr, distanceKm] of dailyMap) {
    const date = new Date(dateStr);

    await prisma.dailyDistance.upsert({
      where: {
        participantId_date: {
          participantId,
          date,
        },
      },
      create: {
        participantId,
        date,
        distanceKm: Math.round(distanceKm * 100) / 100,
      },
      update: {
        distanceKm: Math.round(distanceKm * 100) / 100,
      },
    });
  }
}

/**
 * Sync all active participants
 */
export async function syncAllParticipants(): Promise<
  Array<{
    participantId: string;
    name: string;
    success: boolean;
    activitiesFetched: number;
    activitiesStored: number;
    errorMessage?: string;
  }>
> {
  const participants = await prisma.participant.findMany({
    where: { isActive: true },
  });

  console.log(`[sync] Found ${participants.length} active participants`);

  if (participants.length === 0) {
    console.warn("[sync] No active participants found — nothing to sync");
  }

  for (const p of participants) {
    console.log(
      `[sync] Participant: ${p.name} (id=${p.id}, ` +
      `stravaId=${p.stravaAthleteId}, ` +
      `tokenExpires=${p.tokenExpiresAt.toISOString()}, ` +
      `isActive=${p.isActive})`
    );
  }

  const results = [];

  for (const participant of participants) {
    const result = await syncParticipant(participant);
    results.push({
      participantId: participant.id,
      name: participant.name,
      ...result,
    });
  }

  return results;
}
