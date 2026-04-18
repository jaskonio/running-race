import { getDailyCumulativeStats } from "@/services/stats/daily-stats-service";
import { getWeeklyStats } from "@/services/stats/weekly-stats-service";
import { getMonthlyStats } from "@/services/stats/monthly-stats-service";
import prisma from "@/lib/prisma";
import { getDayOfYear, getDaysInYear } from "@/lib/date";
import type { GoalTracking } from "@/types/stats";

import SummaryCards from "@/components/dashboard/SummaryCards";
import Leaderboard from "@/components/dashboard/Leaderboard";
import DailyProgressChart from "@/components/charts/DailyProgressChart";
import WeeklyChart from "@/components/charts/WeeklyChart";
import MonthlyChart from "@/components/charts/MonthlyChart";
import RangeChart from "@/components/charts/RangeChart";

const GOAL_KM = 3000;

function calculateGoalTracking(
  participants: Awaited<ReturnType<typeof getDailyCumulativeStats>>
): GoalTracking[] {
  const dayOfYear = getDayOfYear();
  const daysInYear = getDaysInYear();
  const expectedProgress = (dayOfYear / daysInYear) * GOAL_KM;

  return participants.map((p) => {
    const totalKm = p.cumulativeTotal;
    const progressPercentage = Math.round((totalKm / GOAL_KM) * 10000) / 100;
    const remainingKm = Math.max(GOAL_KM - totalKm, 0);
    const daysElapsed = dayOfYear;
    const dailyAvgKm = daysElapsed > 0 ? totalKm / daysElapsed : 0;
    const differenceFromPace = Math.round((totalKm - expectedProgress) * 100) / 100;

    let status: GoalTracking["status"];
    let projectedCompletionDate: string | null = null;

    if (totalKm === 0) {
      status = "not-started";
    } else if (totalKm >= GOAL_KM) {
      status = "achieved";
    } else if (differenceFromPace < -50) {
      status = "behind";
    } else if (differenceFromPace > 50) {
      status = "ahead";
    } else {
      status = "on-track";
    }

    if (dailyAvgKm > 0 && totalKm < GOAL_KM) {
      const daysToComplete = Math.ceil((GOAL_KM - totalKm) / dailyAvgKm);
      const completionDate = new Date(2026, 0, 1);
      completionDate.setDate(completionDate.getDate() + daysElapsed + daysToComplete - 1);
      projectedCompletionDate = completionDate.toISOString().split("T")[0];
    }

    return {
      participantId: p.participantId,
      name: p.name,
      totalKm: Math.round(totalKm * 100) / 100,
      goalKm: GOAL_KM,
      progressPercentage,
      remainingKm,
      status,
      projectedCompletionDate,
      dailyAvgKm: Math.round(dailyAvgKm * 100) / 100,
      differenceFromPace,
    };
  });
}

async function getLastSyncDate(): Promise<string | null> {
  const lastSync = await prisma.syncRun.findFirst({
    where: { status: "completed" },
    orderBy: { finishedAt: "desc" },
    select: { finishedAt: true },
  });
  return lastSync?.finishedAt?.toISOString() ?? null;
}

export default async function Home() {
  try {
    const [dailyStats, weeklyStats, monthlyStats, lastSyncDate] =
      await Promise.all([
        getDailyCumulativeStats(),
        getWeeklyStats(),
        getMonthlyStats(),
        getLastSyncDate(),
      ]);

    const goalTracking = calculateGoalTracking(dailyStats);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🏃 Running Challenge 2026
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  3 participantes · 3,000 km cada uno · 365 días
                </p>
              </div>
              <a
                href="/weekly-winners"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Ganadores Semanales
              </a>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Summary Cards */}
            <section>
              <SummaryCards
                participants={dailyStats}
                goalTracking={goalTracking}
                lastSyncDate={lastSyncDate}
              />
            </section>

            {/* Leaderboard */}
            <section>
              <Leaderboard participants={dailyStats} />
            </section>

            {/* Daily Progress Chart */}
            <section>
              <DailyProgressChart participants={dailyStats} />
            </section>

            {/* Weekly Chart */}
            <section>
              <WeeklyChart participants={weeklyStats} />
            </section>

            {/* Monthly Chart */}
            <section>
              <MonthlyChart participants={monthlyStats} />
            </section>

            {/* Range Chart */}
            <section>
              <RangeChart />
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-gray-400">
              Running Challenge 2026 · Datos sincronizados desde Strava
            </p>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Error al cargar el dashboard
          </h2>
          <p className="text-gray-500">
            No se pudieron obtener los datos. Por favor, intentá de nuevo más
            tarde.
          </p>
        </div>
      </div>
    );
  }
}
