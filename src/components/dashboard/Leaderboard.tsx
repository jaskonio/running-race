"use client";

import type { DailyParticipantStats } from "@/types/stats";

const GOAL_KM = 3000;

interface LeaderboardProps {
  participants: DailyParticipantStats[];
}

export default function Leaderboard({ participants }: LeaderboardProps) {
  // Sort by cumulativeTotal descending
  const ranked = [...participants].sort(
    (a, b) => b.cumulativeTotal - a.cumulativeTotal
  );

  if (participants.length === 0) {
    return (
      <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-8 text-center">
        <div className="mb-3 text-3xl text-[#FFD600]">📊</div>
        <p className="text-[#A1A1AA]">No hay datos para mostrar la tabla de posiciones.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#18181B] overflow-hidden transition-all duration-300 hover:border-[#FFD600]/20">
      <div className="border-b border-[#27272A] px-6 py-4">
        <h2 className="text-2xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
          Tabla de Posiciones
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#27272A] text-left text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Participante</th>
              <th className="px-6 py-3 text-right">Total km</th>
              <th className="px-6 py-3 text-right">Progreso</th>
              <th className="px-6 py-3 text-right">Restantes</th>
              <th className="px-6 py-3 text-right">Avance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272A]">
            {ranked.map((participant, index) => {
              const position = index + 1;
              const remaining = Math.max(
                GOAL_KM - participant.cumulativeTotal,
                0
              );
              const barWidth = Math.min(participant.goalProgress, 100);

              return (
                <tr
                  key={participant.participantId}
                  className="transition-colors hover:bg-[#27272A]/30"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        position === 1
                          ? "bg-[#FFD600] text-[#0A0A0A] shadow-[0_0_12px_rgba(255,214,0,0.3)]"
                          : position === 2
                          ? "bg-[#3f3f46] text-[#F5F5F5]"
                          : position === 3
                          ? "bg-[#78350f]/30 text-[#d97706]"
                          : "bg-[#27272A] text-[#A1A1AA]"
                      }`}
                    >
                      {position}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#F5F5F5]">
                    {participant.name}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-[#F5F5F5]">
                    {participant.cumulativeTotal.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-[#A1A1AA]">
                    {participant.goalProgress.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-[#A1A1AA]">
                    {remaining.toFixed(0)} km
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-2 w-full max-w-[120px] rounded-full bg-[#27272A] ml-auto">
                      <div
                        className="h-2 rounded-full bg-[#FFD600] transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
