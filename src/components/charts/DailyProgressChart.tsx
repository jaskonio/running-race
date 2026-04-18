"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailyParticipantStats } from "@/types/stats";

const COLORS = ["#FFD600", "#3B82F6", "#EF4444"];

interface DailyProgressChartProps {
  participants: DailyParticipantStats[];
}

/**
 * Transform participant-first data into date-first format for Recharts.
 * Input:  [{ name: "A", data: [{ date: "2026-01-01", cumulativeKm: 10 }, ...] }, ...]
 * Output: [{ date: "2026-01-01", "A": 10, "B": 8, "C": 12 }, ...]
 */
function transformData(participants: DailyParticipantStats[]) {
  if (participants.length === 0) return [];

  // Use the first participant's dates as the base (all have the same dates)
  const dates = participants[0].data.map((d) => d.date);

  return dates.map((date, i) => {
    const point: Record<string, string | number> = { date };
    for (const p of participants) {
      point[p.name] = p.data[i]?.cumulativeKm ?? 0;
    }
    return point;
  });
}

function formatXAxisDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
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

  const d = new Date(label + "T00:00:00");
  const formattedDate = d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-[#A1A1AA] capitalize">
        {formattedDate}
      </p>
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

export default function DailyProgressChart({
  participants,
}: DailyProgressChartProps) {
  if (participants.length === 0) {
    return (
      <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-8 text-center">
        <div className="mb-3 text-3xl text-[#FFD600]">📈</div>
        <p className="text-[#A1A1AA]">No hay datos para mostrar el progreso diario.</p>
      </div>
    );
  }

  const data = transformData(participants);

  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6 transition-all duration-300 hover:border-[#FFD600]/20">
      <h2 className="mb-4 text-2xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
        Progreso Diario Acumulado
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisDate}
            tick={{ fontSize: 12, fill: "#A1A1AA" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#A1A1AA" }}
            label={{
              value: "km acumulados",
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
            <Line
              key={p.participantId}
              type="monotone"
              dataKey={p.name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
