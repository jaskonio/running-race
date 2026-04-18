import { getDailyCumulativeStats } from "@/services/stats/daily-stats-service";
import { getWeeklyStats } from "@/services/stats/weekly-stats-service";
import { getMonthlyStats } from "@/services/stats/monthly-stats-service";
import prisma from "@/lib/prisma";
import { getDayOfYear, getDaysInYear } from "@/lib/date";
import type { GoalTracking } from "@/types/stats";

import SummaryCards from "@/components/dashboard/SummaryCards";
import Leaderboard from "@/components/dashboard/Leaderboard";
import ConnectStravaButton from "@/components/dashboard/ConnectStravaButton";
import DailyProgressChart from "@/components/charts/DailyProgressChart";
import WeeklyChart from "@/components/charts/WeeklyChart";
import MonthlyChart from "@/components/charts/MonthlyChart";
import RangeChart from "@/components/charts/RangeChart";
import { Suspense } from "react";

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
  let dailyStats: Awaited<ReturnType<typeof getDailyCumulativeStats>> = [];
  let weeklyStats: Awaited<ReturnType<typeof getWeeklyStats>> = [];
  let monthlyStats: Awaited<ReturnType<typeof getMonthlyStats>> = [];
  let lastSyncDate: string | null = null;
  let dbError = false;

  try {
    [dailyStats, weeklyStats, monthlyStats, lastSyncDate] =
      await Promise.all([
        getDailyCumulativeStats(),
        getWeeklyStats(),
        getMonthlyStats(),
        getLastSyncDate(),
      ]);
  } catch (error) {
    console.error("Error loading dashboard:", error);
    dbError = true;
  }

  const goalTracking = calculateGoalTracking(dailyStats);
  const groupTotal = dailyStats.reduce((sum, p) => sum + p.cumulativeTotal, 0);
  const groupGoal = GOAL_KM * dailyStats.length;
  const groupProgress = groupGoal > 0 ? Math.round((groupTotal / groupGoal) * 10000) / 100 : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#27272A] bg-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-bold text-[#FFD600] font-[family-name:var(--font-heading)]">
                RC2026
              </a>
              <nav className="hidden sm:flex items-center gap-4">
                <a
                  href="/"
                  className="text-sm font-medium text-[#F5F5F5] border-b-2 border-[#FFD600] pb-0.5"
                >
                  Dashboard
                </a>
                <a
                  href="/weekly-winners"
                  className="text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#F5F5F5]"
                >
                  Ganadores Semanales
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Suspense>
                <ConnectStravaButton />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {dbError ? (
          <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-8 text-center">
            <div className="mb-3 text-4xl text-[#FFD600]">🔌</div>
            <h2 className="mb-2 text-lg font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
              No se puede conectar a la base de datos
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Verificá que PostgreSQL esté levantado con{" "}
              <code className="rounded bg-[#0A0A0A] px-1.5 py-0.5 font-mono text-xs text-[#FFD600]">
                docker compose up -d
              </code>{" "}
              y que las migraciones estén aplicadas con{" "}
              <code className="rounded bg-[#0A0A0A] px-1.5 py-0.5 font-mono text-xs text-[#FFD600]">
                npx prisma migrate dev
              </code>
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero Section */}
            <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-8 sm:p-10">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-5xl sm:text-6xl font-extrabold text-[#FFD600] tracking-tight font-[family-name:var(--font-heading)]">
                  3000KM CHALLENGE
                </h1>
                <p className="mt-3 text-lg text-[#A1A1AA]">
                  3 runners. 1 year. 1 leaderboard.
                </p>

                {/* Group progress */}
                <div className="mt-8 w-full max-w-2xl">
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-4xl sm:text-5xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
                      {groupTotal.toFixed(1)}
                    </span>
                    <span className="text-xl text-[#A1A1AA]">km</span>
                    <span className="text-xl text-[#A1A1AA]">de</span>
                    <span className="text-4xl sm:text-5xl font-bold text-[#A1A1AA] font-[family-name:var(--font-heading)]">
                      {(groupGoal / 1000).toFixed(0)},000
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-4 w-full rounded-full bg-[#27272A] overflow-hidden">
                    <div
                      className="h-4 rounded-full bg-[#FFD600] transition-all duration-700"
                      style={{ width: `${Math.min(groupProgress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-[#A1A1AA]">
                    <span>{groupProgress.toFixed(1)}% completado</span>
                    {lastSyncDate && (
                      <span>
                        Última sync:{" "}
                        {new Date(lastSyncDate).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

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
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272A]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-[#A1A1AA]">
            Running Challenge 2026 · Datos sincronizados desde Strava
          </p>
        </div>
      </footer>
    </div>
  );
}
