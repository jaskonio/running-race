"use client";

import type { DailyParticipantStats, GoalTracking } from "@/types/stats";

const GOAL_KM = 3000;
const COLORS = ["#2563eb", "#dc2626", "#16a34a"];

interface SummaryCardsProps {
  participants: DailyParticipantStats[];
  goalTracking: GoalTracking[];
  lastSyncDate: string | null;
}

function getMedalEmoji(position: number): string {
  switch (position) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return `#${position}`;
  }
}

function getStatusLabel(status: GoalTracking["status"]): string {
  switch (status) {
    case "not-started":
      return "Sin empezar";
    case "behind":
      return "Detrás del ritmo";
    case "on-track":
      return "En ritmo";
    case "ahead":
      return "Adelantado";
    case "achieved":
      return "¡Objetivo logrado!";
  }
}

function getStatusColor(status: GoalTracking["status"]): string {
  switch (status) {
    case "not-started":
      return "text-gray-500";
    case "behind":
      return "text-orange-500";
    case "on-track":
      return "text-blue-500";
    case "ahead":
      return "text-green-500";
    case "achieved":
      return "text-yellow-500";
  }
}

export default function SummaryCards({
  participants,
  goalTracking,
  lastSyncDate,
}: SummaryCardsProps) {
  // Sort by cumulativeTotal descending for ranking
  const ranked = [...participants].sort(
    (a, b) => b.cumulativeTotal - a.cumulativeTotal
  );

  const groupTotal = participants.reduce(
    (sum, p) => sum + p.cumulativeTotal,
    0
  );
  const groupGoal = GOAL_KM * participants.length;
  const groupProgress = Math.round((groupTotal / groupGoal) * 10000) / 100;

  return (
    <div>
      {/* Group summary */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow-lg">
        <h2 className="text-lg font-semibold opacity-90">
          Progreso del Grupo
        </h2>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-4xl font-bold">
            {groupTotal.toFixed(1)} km
          </span>
          <span className="text-lg opacity-75">
            de {(groupGoal / 1000).toFixed(0)},000 km
          </span>
        </div>
        <div className="mt-3 h-3 w-full rounded-full bg-white/20">
          <div
            className="h-3 rounded-full bg-white transition-all duration-500"
            style={{ width: `${Math.min(groupProgress, 100)}%` }}
          />
        </div>
        <div className="mt-1 text-sm opacity-75">
          {groupProgress.toFixed(1)}% completado
        </div>
        {lastSyncDate && (
          <div className="mt-2 text-xs opacity-60">
            Última sincronización:{" "}
            {new Date(lastSyncDate).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>

      {/* Individual cards */}
      {participants.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          <p className="text-lg">No hay participantes activos aún.</p>
          <p className="mt-2 text-sm">
            Conectá tu cuenta de Strava para empezar a ver el progreso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ranked.map((participant, index) => {
            const position = index + 1;
            const color = COLORS[participants.indexOf(participant)] || COLORS[0];
            const goal = goalTracking.find(
              (g) => g.participantId === participant.participantId
            );
            const remaining = Math.max(GOAL_KM - participant.cumulativeTotal, 0);

            return (
              <div
                key={participant.participantId}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-bold"
                    style={{ color }}
                  >
                    {participant.name}
                  </h3>
                  <span className="text-2xl">
                    {getMedalEmoji(position)}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {participant.cumulativeTotal.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">km</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(participant.goalProgress, 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>{participant.goalProgress.toFixed(1)}%</span>
                    <span>Restan {remaining.toFixed(0)} km</span>
                  </div>
                </div>

                {/* Goal tracking info */}
                {goal && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className={getStatusColor(goal.status)}>
                        {getStatusLabel(goal.status)}
                      </span>
                      {goal.projectedCompletionDate && (
                        <span className="text-xs text-gray-400">
                          Proyección:{" "}
                          {new Date(
                            goal.projectedCompletionDate
                          ).toLocaleDateString("es-ES", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Promedio: {goal.dailyAvgKm.toFixed(1)} km/día
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
