import axios from "axios";
import type { StravaActivity } from "@/types/activity";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

/**
 * Fetch activities from Strava API with pagination
 * Returns all activities after the given date
 */
export async function fetchActivities(
  accessToken: string,
  after?: Date,
  before?: Date
): Promise<StravaActivity[]> {
  const allActivities: StravaActivity[] = [];
  let page = 1;
  const perPage = 100;

  console.log(
    `[strava-api] Fetching activities ` +
    `after=${after?.toISOString() || "none"} before=${before?.toISOString() || "none"}`
  );

  while (true) {
    const params: Record<string, string | number> = {
      page,
      per_page: perPage,
    };

    if (after) {
      params.after = Math.floor(after.getTime() / 1000);
    }

    if (before) {
      params.before = Math.floor(before.getTime() / 1000);
    }

    console.log(`[strava-api] Requesting page ${page} (per_page=${perPage})`);

    const response = await axios.get<StravaActivity[]>(
      `${STRAVA_API_BASE}/athlete/activities`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      }
    );

    const activities = response.data;
    console.log(`[strava-api] Page ${page} returned ${activities.length} activities`);

    if (activities.length === 0) {
      break;
    }

    allActivities.push(...activities);

    // If we got less than perPage, we've reached the end
    if (activities.length < perPage) {
      break;
    }

    page++;
  }

  console.log(
    `[strava-api] Total activities fetched: ${allActivities.length} across ${page} page(s)`
  );

  return allActivities;
}

/**
 * Filter activities to only include running activities within the challenge date range
 */
export function filterRunningActivities(
  activities: StravaActivity[],
  dateFrom: Date,
  dateTo: Date
): StravaActivity[] {
  return activities.filter((activity) => {
    // Only running activities
    if (activity.sport_type !== "Run" && activity.type !== "Run") {
      return false;
    }

    // Within challenge date range
    const startDate = new Date(activity.start_date);
    return startDate >= dateFrom && startDate <= dateTo;
  });
}

/**
 * Convert Strava activity distance from meters to kilometers
 */
export function metersToKm(meters: number): number {
  return Math.round(meters / 1000 * 100) / 100; // Round to 2 decimal places
}
