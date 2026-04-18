import prisma from "@/lib/prisma";
import { formatDate, getAllDaysInChallenge } from "@/lib/date";
import type { DailyParticipantStats, DailyDataPoint } from "@/types/stats";

const GOAL_KM = 3000;

/**
 * Get daily cumulative statistics for all participants
 * Returns cumulative km per day from challenge start to today
 */
export async function getDailyCumulativeStats(): Promise<DailyParticipantStats[]> {
  const participants = await prisma.participant.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const allDays = getAllDaysInChallenge();

  const result: DailyParticipantStats[] = [];

  for (const participant of participants) {
    // Get all daily distances for this participant
    const dailyDistances = await prisma.dailyDistance.findMany({
      where: { participantId: participant.id },
      orderBy: { date: "asc" },
    });

    // Create a map for quick lookup
    const distanceMap = new Map<string, number>();
    for (const dd of dailyDistances) {
      distanceMap.set(formatDate(dd.date), dd.distanceKm);
    }

    // Build cumulative data for each day
    let cumulative = 0;
    const data: DailyDataPoint[] = allDays.map((day) => {
      const dateStr = formatDate(day);
      const dayDistance = distanceMap.get(dateStr) || 0;
      cumulative += dayDistance;

      return {
        date: dateStr,
        distanceKm: Math.round(dayDistance * 100) / 100,
        cumulativeKm: Math.round(cumulative * 100) / 100,
      };
    });

    result.push({
      participantId: participant.id,
      name: participant.name,
      data,
      cumulativeTotal: Math.round(cumulative * 100) / 100,
      goalProgress: Math.round((cumulative / GOAL_KM) * 10000) / 100, // Percentage with 2 decimals
    });
  }

  return result;
}
