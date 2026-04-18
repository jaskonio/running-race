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

const COLORS = ["#FFD600", "#3B82F6", "#EF4444"];

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
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-[#A1A1AA]">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#A1A1AA]">{entry.name}:</span>
          <span className="font-semibold text-[#F5F5F5]">
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
      <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-8 text-center">
        <div className="mb-3 text-3xl text-[#FFD600]">📊</div>
        <p className="text-[#A1A1AA]">No hay datos para mostrar las estadísticas semanales.</p>
      </div>
    );
  }

  const data = transformData(participants);

  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6 transition-all duration-300 hover:border-[#FFD600]/20">
      <h2 className="mb-4 text-2xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
        Kilómetros por Semana
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
          <XAxis
            dataKey="week"
            tickFormatter={formatWeekLabel}
            tick={{ fontSize: 12, fill: "#A1A1AA" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#A1A1AA" }}
            label={{
              value: "km",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "#A1A1AA" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#A1A1AA" }}
          />
          {participants.map((p, i) => (
            <Bar
              key={p.participantId}
              dataKey={p.name}
              fill={COLORS[i % COLORS.length]}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
