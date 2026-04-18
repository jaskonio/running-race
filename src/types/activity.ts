// TypeScript types for Activity model

export interface Activity {
  id: string;
  participantId: string;
  stravaActivityId: string;
  name: string;
  sportType: string;
  distanceKm: number;
  movingTimeSec: number;
  elapsedTimeSec: number;
  startDate: Date;
  activityDate: Date;
  createdAt: Date;
}

// Raw activity returned by Strava API
export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  start_date: string; // ISO 8601
  start_date_local: string; // ISO 8601 local
  type: string;
  athlete?: {
    id: number;
  };
}

// Filter criteria for Strava activities
export interface ActivityFilter {
  sportType: string;
  dateFrom: Date;
  dateTo: Date;
}
