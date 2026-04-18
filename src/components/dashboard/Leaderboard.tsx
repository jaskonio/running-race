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
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        <p>No hay datos para mostrar la tabla de posiciones.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900">
          Tabla de Posiciones
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Participante</th>
              <th className="px-6 py-3 text-right">Total km</th>
              <th className="px-6 py-3 text-right">Progreso</th>
              <th className="px-6 py-3 text-right">Restantes</th>
              <th className="px-6 py-3 text-right">Avance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
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
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        position === 1
                          ? "bg-yellow-100 text-yellow-700"
                          : position === 2
                          ? "bg-gray-100 text-gray-600"
                          : position === 3
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {position}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {participant.name}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900">
                    {participant.cumulativeTotal.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">
                    {participant.goalProgress.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">
                    {remaining.toFixed(0)} km
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-2 w-full max-w-[120px] rounded-full bg-gray-100 ml-auto">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
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
