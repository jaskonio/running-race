import { getWeeklyWinners } from "@/services/stats/rankings-service";
import Link from "next/link";

export default async function WeeklyWinnersPage() {
  try {
    const { weeks, summary } = await getWeeklyWinners();

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🏆 Ganadores Semanales
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Historial de ganadores por semana — Running Challenge 2026
                </p>
              </div>
              <Link
                href="/"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                ← Volver al Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Summary Cards */}
            {summary.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Resumen de Victorias
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {summary.map((s, i) => {
                    const colors = [
                      "border-blue-500 bg-blue-50",
                      "border-red-500 bg-red-50",
                      "border-green-500 bg-green-50",
                    ];
                    return (
                      <div
                        key={s.participantId}
                        className={`rounded-xl border-l-4 ${colors[i % colors.length]} p-5 shadow-sm`}
                      >
                        <h3 className="text-lg font-bold text-gray-900">
                          {s.name}
                        </h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Semanas ganadas</span>
                            <span className="font-bold text-gray-900">
                              {s.weeksWon}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Racha actual</span>
                            <span className="font-bold text-gray-900">
                              {s.currentStreak}{" "}
                              {s.currentStreak === 1 ? "semana" : "semanas"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mejor racha</span>
                            <span className="font-bold text-gray-900">
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
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Resultados por Semana
              </h2>

              {weeks.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  <p>No hay datos de semanas aún.</p>
                  <p className="mt-2 text-sm">
                    Los resultados aparecerán cuando haya actividades
                    sincronizadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...weeks].reverse().map((week) => (
                    <div
                      key={week.isoWeek}
                      className={`rounded-xl border bg-white shadow-sm ${
                        week.isInProgress
                          ? "border-blue-300 ring-2 ring-blue-100"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Week header */}
                      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {week.isoWeek}
                          </h3>
                          <p className="text-xs text-gray-500">
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
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                              En progreso
                            </span>
                          )}
                          {week.winner && !week.isInProgress && (
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                              🏆 {week.winner.name} — {week.winner.km.toFixed(1)} km
                            </span>
                          )}
                          {!week.winner && !week.isInProgress && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
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
                              "bg-blue-500",
                              "bg-red-500",
                              "bg-green-500",
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
                                <span className="w-6 text-center text-sm font-bold text-gray-500">
                                  {i + 1}
                                </span>
                                <span className="w-24 text-sm font-medium text-gray-900">
                                  {ranking.name}
                                </span>
                                <div className="flex-1">
                                  <div className="h-4 w-full rounded-full bg-gray-100">
                                    <div
                                      className={`h-4 rounded-full ${barColors[i % barColors.length]} transition-all duration-300`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="w-20 text-right text-sm font-mono font-semibold text-gray-700">
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
    console.error("Error loading weekly winners:", error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Error al cargar los ganadores semanales
          </h2>
          <p className="text-gray-500">
            No se pudieron obtener los datos. Por favor, intentá de nuevo más
            tarde.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }
}
