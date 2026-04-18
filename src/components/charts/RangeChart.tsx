"use client";

import { useState, useMemo } from "react";
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
import type { RangeParticipantStats } from "@/types/stats";

const COLORS = ["#FFD600", "#3B82F6", "#EF4444"];

function formatDateInput(d: Date): string {
  return d.toISOString().split("T")[0];
}

interface RangeChartProps {
  /** Initial participants data (empty range = no data initially) */
  initialParticipants?: RangeParticipantStats[];
}

function transformData(participants: RangeParticipantStats[]) {
  if (participants.length === 0) return [];

  const dates = participants[0].data.map((d) => d.date);

  return dates.map((date, i) => {
    const point: Record<string, string | number> = { date };
    for (const p of participants) {
      point[p.name] = p.data[i]?.distanceKm ?? 0;
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
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-[#A1A1AA]">{formattedDate}</p>
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

export default function RangeChart({ initialParticipants }: RangeChartProps) {
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const [fromDate, setFromDate] = useState(formatDateInput(defaultFrom));
  const [toDate, setToDate] = useState(formatDateInput(today));
  const [participants, setParticipants] = useState<RangeParticipantStats[]>(
    initialParticipants || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = fromDate && toDate && fromDate <= toDate;

  async function fetchRangeData() {
    if (!canFetch) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/stats/range?from=${fromDate}&to=${toDate}`
      );
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Error al obtener datos");
        return;
      }

      setParticipants(json.data);
    } catch {
      setError("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(() => transformData(participants), [participants]);

  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6 transition-all duration-300 hover:border-[#FFD600]/20">
      <h2 className="mb-4 text-2xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
        Rango Personalizado
      </h2>

      {/* Date inputs */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="range-from"
            className="mb-1 block text-sm font-medium text-[#A1A1AA]"
          >
            Desde
          </label>
          <input
            id="range-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            min="2026-01-01"
            max="2026-12-31"
            className="rounded-xl border border-[#27272A] bg-[#18181B] px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#FFD600] focus:outline-none focus:ring-1 focus:ring-[#FFD600] [color-scheme:dark]"
          />
        </div>
        <div>
          <label
            htmlFor="range-to"
            className="mb-1 block text-sm font-medium text-[#A1A1AA]"
          >
            Hasta
          </label>
          <input
            id="range-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min="2026-01-01"
            max="2026-12-31"
            className="rounded-xl border border-[#27272A] bg-[#18181B] px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#FFD600] focus:outline-none focus:ring-1 focus:ring-[#FFD600] [color-scheme:dark]"
          />
        </div>
        <button
          onClick={fetchRangeData}
          disabled={!canFetch || loading}
          className="rounded-xl bg-[#FFD600] px-4 py-2 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#FFEA00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Buscar"}
        </button>
      </div>

      {!canFetch && fromDate && toDate && (
        <p className="mb-4 text-sm text-red-400">
          La fecha &quot;desde&quot; debe ser anterior o igual a la fecha &quot;hasta&quot;.
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Chart */}
      {participants.length === 0 && !loading ? (
        <div className="py-8 text-center">
          <div className="mb-2 text-3xl text-[#FFD600]">🔍</div>
          <p className="text-[#A1A1AA]">Seleccioná un rango de fechas y hacé clic en &quot;Buscar&quot;</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
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
      )}
    </div>
  );
}
