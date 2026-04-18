import prisma from "@/lib/prisma";
import {
  formatDate,
  formatWeekLabel,
  getChallengeStart,
  getChallengeEnd,
} from "@/lib/date";
import type {
  RangeParticipantStats,
  RangeDataPoint,
  WeeklyWinner,
  WeeklyRanking,
} from "@/types/stats";
import {
  endOfWeek,
  eachWeekOfInterval,
  eachDayOfInterval,
  isAfter,
  startOfDay,
  endOfDay,
} from "date-fns";

/**
 * Get stats for a custom date range
 */
export async function getRangeStats(
  from: Date,
  to: Date
): Promise<RangeParticipantStats[]> {
  const participants = await prisma.participant.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const days = eachDayOfInterval({
    start: startOfDay(from),
    end: endOfDay(to),
  });

  const result: RangeParticipantStats[] = [];

  for (const participant of participants) {
    const dailyDistances = await prisma.dailyDistance.findMany({
      where: {
        participantId: participant.id,
        date: {
          gte: startOfDay(from),
          lte: endOfDay(to),
        },
      },
      orderBy: { date: "asc" },
    });

    const distanceMap = new Map<string, number>();
    for (const dd of dailyDistances) {
      distanceMap.set(formatDate(dd.date), dd.distanceKm);
    }

    const data: RangeDataPoint[] = days.map((day) => {
      const dateStr = formatDate(day);
      return {
        date: dateStr,
        distanceKm: distanceMap.get(dateStr) || 0,
      };
    });

    const totalKm = data.reduce((sum, d) => sum + d.distanceKm, 0);

    result.push({
      participantId: participant.id,
      name: participant.name,
      data,
      totalKm: Math.round(totalKm * 100) / 100,
    });
  }

  return result;
}

/**
 * Get all weekly winners with rankings for the entire challenge
 */
export async function getWeeklyWinners(): Promise<{
  weeks: WeeklyWinner[];
  summary: Array<{
    participantId: string;
    name: string;
    weeksWon: number;
    currentStreak: number;
    bestStreak: number;
  }>;
}> {
  const participants = await prisma.participant.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const today = new Date();
  const cappedEnd = today > getChallengeEnd() ? getChallengeEnd() : today;

  const weekStarts = eachWeekOfInterval(
    { start: getChallengeStart(), end: cappedEnd },
    { weekStartsOn: 1 }
  );

  const weeks: WeeklyWinner[] = [];
  const weeksWonMap = new Map<string, number>();
  const winsHistory: string[] = []; // Track winner IDs per week

  // Initialize weeks won counter
  for (const p of participants) {
    weeksWonMap.set(p.id, 0);
  }

  for (const weekStart of weekStarts) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const isoWeek = formatWeekLabel(weekStart);
    const isInProgress = isAfter(weekEnd, today);

    // Get daily distances for this week for all participants
    const rankings: WeeklyRanking[] = [];

    for (const participant of participants) {
      const dailyDistances = await prisma.dailyDistance.findMany({
        where: {
          participantId: participant.id,
          date: {
            gte: startOfDay(weekStart),
            lte: endOfDay(isInProgress ? today : weekEnd),
          },
        },
      });

      const weeklyTotal = dailyDistances.reduce(
        (sum, dd) => sum + dd.distanceKm,
        0
      );

      rankings.push({
        participantId: participant.id,
        name: participant.name,
        distanceKm: Math.round(weeklyTotal * 100) / 100,
      });
    }

    // Sort by distance descending
    rankings.sort((a, b) => b.distanceKm - a.distanceKm);

    // Determine winner (only if week is complete)
    // Ties are broken by alphabetical name order (deterministic)
    let winner: WeeklyWinner["winner"] = null;
    if (!isInProgress && rankings.length > 0 && rankings[0].distanceKm > 0) {
      // Check for tie at first place
      const topKm = rankings[0].distanceKm;
      const tiedParticipants = rankings.filter(r => r.distanceKm === topKm);
      const tieWinner = tiedParticipants.length > 1
        ? tiedParticipants.sort((a, b) => a.name.localeCompare(b.name))[0]
        : rankings[0];

      winner = {
        participantId: tieWinner.participantId,
        name: tieWinner.name,
        km: tieWinner.distanceKm,
      };

      // Track weeks won
      const currentWon = weeksWonMap.get(tieWinner.participantId) || 0;
      weeksWonMap.set(tieWinner.participantId, currentWon + 1);
      winsHistory.push(tieWinner.participantId);
    } else {
      winsHistory.push(""); // No winner for this week
    }

    weeks.push({
      isoWeek,
      startDate: formatDate(weekStart),
      endDate: formatDate(weekEnd),
      winner,
      rankings,
      isInProgress,
    });
  }

  // Calculate streaks
  const summary = participants.map((p) => {
    const weeksWon = weeksWonMap.get(p.id) || 0;

    // Calculate current streak (from most recent week going back)
    let currentStreak = 0;
    for (let i = winsHistory.length - 1; i >= 0; i--) {
      if (winsHistory[i] === p.id) {
        currentStreak++;
      } else if (winsHistory[i] !== "") {
        break;
      }
    }

    // Calculate best streak
    let bestStreak = 0;
    let streak = 0;
    for (const winnerId of winsHistory) {
      if (winnerId === p.id) {
        streak++;
        bestStreak = Math.max(bestStreak, streak);
      } else if (winnerId !== "") {
        streak = 0;
      }
    }

    return {
      participantId: p.id,
      name: p.name,
      weeksWon,
      currentStreak,
      bestStreak,
    };
  });

  // Sort summary by weeks won descending
  summary.sort((a, b) => b.weeksWon - a.weeksWon);

  return { weeks, summary };
}
