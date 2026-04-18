import { getWeeklyWinners } from "@/services/stats/rankings-service";
import Link from "next/link";

export default async function WeeklyWinnersPage() {
  try {
    const { weeks, summary } = await getWeeklyWinners();

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
                    className="text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#F5F5F5]"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/weekly-winners"
                    className="text-sm font-medium text-[#F5F5F5] border-b-2 border-[#FFD600] pb-0.5"
                  >
                    Ganadores Semanales
                  </a>
                </nav>
              </div>
              <Link
                href="/"
                className="rounded-xl border border-[#27272A] px-4 py-2 text-sm font-medium text-[#F5F5F5] transition-colors hover:border-[#FFD600]"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
                🏆 Ganadores Semanales
              </h1>
              <p className="mt-1 text-sm text-[#A1A1AA]">
                Historial de ganadores por semana — Running Challenge 2026
              </p>
            </div>

            {/* Summary Cards */}
            {summary.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
                  Resumen de Victorias
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {summary.map((s, i) => {
                    const accentColors = [
                      "border-l-[#FFD600]",
                      "border-l-[#3B82F6]",
                      "border-l-[#EF4444]",
                    ];
                    return (
                      <div
                        key={s.participantId}
                        className={`rounded-2xl border border-[#27272A] border-l-4 ${accentColors[i % accentColors.length]} bg-[#18181B] p-5 transition-all duration-300 hover:border-[#FFD600]/30`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
                            {s.name}
                          </h3>
                          {i === 0 && s.weeksWon > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD600] px-2.5 py-0.5 text-xs font-bold text-[#0A0A0A]">
                              👑 Líder
                            </span>
                          )}
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#A1A1AA]">Semanas ganadas</span>
                            <span className="font-bold text-[#FFD600]">
                              {s.weeksWon}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#A1A1AA]">Racha actual</span>
                            <span className="font-bold text-[#F5F5F5]">
                              {s.currentStreak}{" "}
                              {s.currentStreak === 1 ? "semana" : "semanas"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#A1A1AA]">Mejor racha</span>
                            <span className="font-bold text-[#F5F5F5]">
                              {s.bestStreak}{" "}
                              {s.bestStreak === 1 ? "semana" : "semanas"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Weekly Results */}
            <section>
              <h2 className="mb-4 text-2xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
                Resultados por Semana
              </h2>

              {weeks.length === 0 ? (
                <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-8 text-center">
                  <div className="mb-3 text-3xl text-[#FFD600]">🏆</div>
                  <p className="text-[#F5F5F5]">No hay datos de semanas aún.</p>
                  <p className="mt-2 text-sm text-[#A1A1AA]">
                    Los resultados aparecerán cuando haya actividades
                    sincronizadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...weeks].reverse().map((week) => (
                    <div
                      key={week.isoWeek}
                      className={`rounded-2xl border bg-[#18181B] transition-all duration-300 hover:border-[#FFD600]/20 ${
                        week.isInProgress
                          ? "border-blue-500/30"
                          : "border-[#27272A]"
                      }`}
                    >
                      {/* Week header */}
                      <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-3">
                        <div>
                          <h3 className="font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
                            {week.isoWeek}
                          </h3>
                          <p className="text-xs text-[#A1A1AA]">
                            {new Date(week.startDate + "T00:00:00").toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            —{" "}
                            {new Date(week.endDate + "T00:00:00").toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {week.isInProgress && (
                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                              En progreso
                            </span>
                          )}
                          {week.winner && !week.isInProgress && (
                            <span className="rounded-full bg-[#FFD600] px-3 py-1 text-xs font-bold text-[#0A0A0A]">
                              🏆 {week.winner.name} — {week.winner.km.toFixed(1)} km
                            </span>
                          )}
                          {!week.winner && !week.isInProgress && (
                            <span className="rounded-full bg-[#27272A] px-3 py-1 text-xs font-medium text-[#A1A1AA]">
                              Sin actividades
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rankings for this week */}
                      <div className="px-6 py-3">
                        <div className="space-y-2">
                          {week.rankings.map((ranking, i) => {
                            const barColors = [
                              "bg-[#FFD600]",
                              "bg-[#3B82F6]",
                              "bg-[#EF4444]",
                            ];
                            const maxKm = Math.max(
                              ...week.rankings.map((r) => r.distanceKm),
                              1
                            );
                            const barWidth =
                              (ranking.distanceKm / maxKm) * 100;

                            return (
                              <div
                                key={ranking.participantId}
                                className="flex items-center gap-4"
                              >
                                <span className={`w-6 text-center text-sm font-bold ${i === 0 ? "text-[#FFD600]" : "text-[#A1A1AA]"}`}>
                                  {i + 1}
                                </span>
                                <span className="w-24 text-sm font-medium text-[#F5F5F5]">
                                  {ranking.name}
                                </span>
                                <div className="flex-1">
                                  <div className="h-4 w-full rounded-full bg-[#27272A]">
                                    <div
                                      className={`h-4 rounded-full ${barColors[i % barColors.length]} transition-all duration-300`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="w-20 text-right text-sm font-mono font-semibold text-[#F5F5F5]">
                                  {ranking.distanceKm.toFixed(1)} km
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
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
  } catch (error) {
    console.error("Error loading weekly winners:", error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="max-w-md rounded-2xl border border-[#27272A] bg-[#18181B] p-8 text-center">
          <div className="mb-4 text-4xl text-[#FFD600]">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
            Error al cargar los ganadores semanales
          </h2>
          <p className="text-[#A1A1AA]">
            No se pudieron obtener los datos. Por favor, intentá de nuevo más
            tarde.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-[#FFD600] px-4 py-2 text-sm font-bold text-[#0A0A0A] hover:bg-[#FFEA00]"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }
}
