import prisma from "@/lib/prisma";
import { formatMonth, getChallengeStart, getChallengeEnd } from "@/lib/date";
import type { MonthlyParticipantStats, MonthlyDataPoint } from "@/types/stats";
import { eachMonthOfInterval } from "date-fns";

/**
 * Get monthly aggregated statistics for all participants
 */
export async function getMonthlyStats(): Promise<MonthlyParticipantStats[]> {
  const participants = await prisma.participant.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Get all months in the challenge
  const today = new Date();
  const cappedEnd = today > getChallengeEnd() ? getChallengeEnd() : today;
  const months = eachMonthOfInterval({
    start: getChallengeStart(),
    end: cappedEnd,
  });

  const result: MonthlyParticipantStats[] = [];

  for (const participant of participants) {
    // Get all daily distances for this participant
    const dailyDistances = await prisma.dailyDistance.findMany({
      where: { participantId: participant.id },
      orderBy: { date: "asc" },
    });

    // Group daily distances by month
    const monthlyMap = new Map<string, number>();

    for (const dd of dailyDistances) {
      const monthLabel = formatMonth(dd.date);
      const current = monthlyMap.get(monthLabel) || 0;
      monthlyMap.set(monthLabel, current + dd.distanceKm);
    }

    // Build data for each month
    const data: MonthlyDataPoint[] = months.map((monthStart) => {
      const monthLabel = formatMonth(monthStart);
      const distanceKm = monthlyMap.get(monthLabel) || 0;

      return {
        month: monthLabel,
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
