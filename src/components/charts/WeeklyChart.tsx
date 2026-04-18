"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyParticipantStats } from "@/types/stats";

const COLORS = ["#2563eb", "#dc2626", "#16a34a"];

interface WeeklyChartProps {
  participants: WeeklyParticipantStats[];
}

function transformData(participants: WeeklyParticipantStats[]) {
  if (participants.length === 0) return [];

  const weeks = participants[0].data.map((d) => d.week);

  return weeks.map((week, i) => {
    const point: Record<string, string | number> = { week };
    for (const p of participants) {
      point[p.name] = p.data[i]?.distanceKm ?? 0;
    }
    return point;
  });
}

function formatWeekLabel(week: string): string {
  // "2026-W01" → "S1" (Semana 1)
  const parts = week.split("-W");
  if (parts.length === 2) {
    return `S${parseInt(parts[1], 10)}`;
  }
  return week;
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {entry.value.toFixed(1)} km
          </span>
        </div>
      ))}
    </div>
  );
}

export default function WeeklyChart({ participants }: WeeklyChartProps) {
  if (participants.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        <p>No hay datos para mostrar las estadísticas semanales.</p>
      </div>
    );
  }

  const data = transformData(participants);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">
        Kilómetros por Semana
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="week"
            tickFormatter={formatWeekLabel}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: "km",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "#9ca3af" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {participants.map((p, i) => (
            <Bar
              key={p.participantId}
              dataKey={p.name}
              fill={COLORS[i % COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
