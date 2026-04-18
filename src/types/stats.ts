// TypeScript types for Stats API responses

export interface DailyDataPoint {
  date: string;
  distanceKm: number;
  cumulativeKm: number;
}

export interface DailyParticipantStats {
  participantId: string;
  name: string;
  data: DailyDataPoint[];
  cumulativeTotal: number;
  goalProgress: number;
}

export interface DailyStatsResponse {
  success: true;
  data: DailyParticipantStats[];
}

export interface WeeklyDataPoint {
  week: string; // e.g., "2026-W01"
  distanceKm: number;
}

export interface WeeklyParticipantStats {
  participantId: string;
  name: string;
  data: WeeklyDataPoint[];
  totalKm: number;
}

export interface WeeklyStatsResponse {
  success: true;
  data: WeeklyParticipantStats[];
}

export interface MonthlyDataPoint {
  month: string; // e.g., "2026-01"
  distanceKm: number;
}

export interface MonthlyParticipantStats {
  participantId: string;
  name: string;
  data: MonthlyDataPoint[];
  totalKm: number;
}

export interface MonthlyStatsResponse {
  success: true;
  data: MonthlyParticipantStats[];
}

export interface RangeDataPoint {
  date: string;
  distanceKm: number;
}

export interface RangeParticipantStats {
  participantId: string;
  name: string;
  data: RangeDataPoint[];
  totalKm: number;
}

export interface RangeStatsResponse {
  success: true;
  data: RangeParticipantStats[];
}

export interface WeeklyRanking {
  participantId: string;
  name: string;
  distanceKm: number;
}

export interface WeeklyWinner {
  isoWeek: string;
  startDate: string;
  endDate: string;
  winner: {
    participantId: string;
    name: string;
    km: number;
  } | null;
  rankings: WeeklyRanking[];
  isInProgress: boolean;
}

export interface WeeklyWinnersResponse {
  success: true;
  data: {
    weeks: WeeklyWinner[];
    summary: {
      participantId: string;
      name: string;
      weeksWon: number;
      currentStreak: number;
      bestStreak: number;
    }[];
  };
}

export interface GoalTracking {
  participantId: string;
  name: string;
  totalKm: number;
  goalKm: number;
  progressPercentage: number;
  remainingKm: number;
  status: "not-started" | "behind" | "on-track" | "ahead" | "achieved";
  projectedCompletionDate: string | null;
  dailyAvgKm: number;
  differenceFromPace: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
}
