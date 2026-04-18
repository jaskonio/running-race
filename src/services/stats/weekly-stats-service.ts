import prisma from "@/lib/prisma";
import { formatWeekLabel, getChallengeStart, getChallengeEnd } from "@/lib/date";
import type { WeeklyParticipantStats, WeeklyDataPoint } from "@/types/stats";
import {
  eachWeekOfInterval,
} from "date-fns";

/**
 * Get weekly aggregated statistics for all participants
 */
export async function getWeeklyStats(): Promise<WeeklyParticipantStats[]> {
  const participants = await prisma.participant.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Get all weeks in the challenge
  const today = new Date();
  const cappedEnd = today > getChallengeEnd() ? getChallengeEnd() : today;
  const weeks = eachWeekOfInterval(
    { start: getChallengeStart(), end: cappedEnd },
    { weekStartsOn: 1 }
  );

  const result: WeeklyParticipantStats[] = [];

  for (const participant of participants) {
    // Get all daily distances for this participant
    const dailyDistances = await prisma.dailyDistance.findMany({
      where: { participantId: participant.id },
      orderBy: { date: "asc" },
    });

    // Group daily distances by week
    const weeklyMap = new Map<string, number>();

    for (const dd of dailyDistances) {
      const weekLabel = formatWeekLabel(dd.date);
      const current = weeklyMap.get(weekLabel) || 0;
      weeklyMap.set(weekLabel, current + dd.distanceKm);
    }

    // Build data for each week
    const data: WeeklyDataPoint[] = weeks.map((weekStart) => {
      const weekLabel = formatWeekLabel(weekStart);
      const distanceKm = weeklyMap.get(weekLabel) || 0;

      return {
        week: weekLabel,
        distanceKm: Math.round(distanceKm * 100) / 100,
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
