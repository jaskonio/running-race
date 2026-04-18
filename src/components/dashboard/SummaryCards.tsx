"use client";

import type { DailyParticipantStats, GoalTracking } from "@/types/stats";

const GOAL_KM = 3000;

interface SummaryCardsProps {
  participants: DailyParticipantStats[];
  goalTracking: GoalTracking[];
  lastSyncDate: string | null;
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

function getStatusBadgeClasses(status: GoalTracking["status"]): string {
  switch (status) {
    case "not-started":
      return "bg-[#27272A] text-[#A1A1AA]";
    case "behind":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    case "on-track":
      return "bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20";
    case "ahead":
      return "bg-green-500/10 text-green-400 border border-green-500/20";
    case "achieved":
      return "bg-[#FFD600] text-[#0A0A0A]";
  }
}

function getPositionBadgeClasses(position: number): string {
  switch (position) {
    case 1:
      return "bg-[#FFD600] text-[#0A0A0A] shadow-[0_0_12px_rgba(255,214,0,0.3)]";
    case 2:
      return "bg-[#27272A] text-[#A1A1AA]";
    case 3:
      return "bg-[#27272A] text-[#A1A1AA]";
    default:
      return "bg-[#27272A] text-[#A1A1AA]";
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

  return (
    <div>
      {/* Section title */}
      <h2 className="mb-4 text-2xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
        Participantes
      </h2>

      {/* Individual cards */}
      {participants.length === 0 ? (
        <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-8 text-center">
          <div className="mb-3 text-3xl text-[#FFD600]">🏃</div>
          <p className="text-lg text-[#F5F5F5]">No hay participantes activos aún.</p>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Conectá tu cuenta de Strava para empezar a ver el progreso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ranked.map((participant, index) => {
            const position = index + 1;
            const goal = goalTracking.find(
              (g) => g.participantId === participant.participantId
            );
            const remaining = Math.max(GOAL_KM - participant.cumulativeTotal, 0);

            return (
              <div
                key={participant.participantId}
                className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5 transition-all duration-300 hover:border-[#FFD600]/30"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
                    {participant.name}
                  </h3>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${getPositionBadgeClasses(position)}`}
                  >
                    #{position}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
                      {participant.cumulativeTotal.toFixed(1)}
                    </span>
                    <span className="text-sm text-[#A1A1AA]">km</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-[#27272A]">
                    <div
                      className="h-2 rounded-full bg-[#FFD600] transition-all duration-500"
                      style={{ width: `${Math.min(participant.goalProgress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs text-[#A1A1AA]">
                    <span>{participant.goalProgress.toFixed(1)}%</span>
                    <span>Restan {remaining.toFixed(0)} km</span>
                  </div>
                </div>

                {/* Goal tracking info */}
                {goal && (
                  <div className="mt-4 border-t border-[#27272A] pt-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClasses(goal.status)}`}
                      >
                        {getStatusLabel(goal.status)}
                      </span>
                      {goal.projectedCompletionDate && (
                        <span className="text-xs text-[#A1A1AA]">
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
                    <div className="mt-2 text-xs text-[#A1A1AA]">
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
