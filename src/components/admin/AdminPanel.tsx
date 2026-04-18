"use client";

import { useState } from "react";
import { RefreshCw, Play, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  stravaAthleteId: string;
  isActive: boolean;
  tokenExpiresAt: string | Date;
}

interface SyncRun {
  id: string;
  participantName: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  activitiesFetched: number;
  activitiesStored: number;
  errorMessage: string | null;
}

interface AdminPanelProps {
  participants: Participant[];
  syncRuns: SyncRun[];
}

export default function AdminPanel({ participants, syncRuns: initialSyncRuns }: AdminPanelProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    data?: Array<{
      name: string;
      success: boolean;
      activitiesFetched: number;
      activitiesStored: number;
      errorMessage?: string;
    }>;
    error?: string;
  } | null>(null);
  const [syncRuns, setSyncRuns] = useState(initialSyncRuns);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function runSync() {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
      });

      const json = await res.json();

      setSyncResult(json);

      // Refresh sync runs
      if (json.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setSyncResult({ success: false, error: "Network error" });
    } finally {
      setSyncing(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  }

  async function toggleParticipant(id: string, currentActive: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/participants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setTogglingId(null);
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="space-y-8">
      {/* Sync Control */}
      <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
              Sincronización Strava
            </h2>
            <p className="mt-1 text-sm text-[#A1A1AA]">
              Ejecutar sync manual para todos los participantes activos
            </p>
          </div>
          <button
            onClick={runSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFD600] px-6 py-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#FFEA00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Ejecutar Sync"}
          </button>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className="mt-4 space-y-2">
            {syncResult.error && (
              <div className="rounded-xl border border-red-900 bg-red-950 p-4 text-sm text-red-300">
                ❌ {syncResult.error}
              </div>
            )}
            {syncResult.data?.map((r, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 text-sm ${
                  r.success
                    ? "border-green-900 bg-green-950 text-green-300"
                    : "border-red-900 bg-red-950 text-red-300"
                }`}
              >
                <span className="font-bold">{r.success ? "✅" : "❌"} {r.name}</span>
                {" — "}fetched: {r.activitiesFetched}, stored: {r.activitiesStored}
                {r.errorMessage && <span className="block mt-1 text-xs opacity-80">{r.errorMessage}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Participants */}
      <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6">
        <h2 className="mb-4 text-xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
          Participantes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272A] text-left text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">
                <th className="pb-3 pr-4">Nombre</th>
                <th className="pb-3 pr-4">Strava ID</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Token expira</th>
                <th className="pb-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]">
              {participants.map((p) => (
                <tr key={p.id} className="text-[#F5F5F5]">
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-[#A1A1AA]">{p.stravaAthleteId}</td>
                  <td className="py-3 pr-4">
                    {p.isActive ? (
                      <span className="rounded-full bg-green-900 px-2 py-0.5 text-xs text-green-400">Activo</span>
                    ) : (
                      <span className="rounded-full bg-red-900 px-2 py-0.5 text-xs text-red-400">Inactivo</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-xs text-[#A1A1AA]">
                    {new Date(p.tokenExpiresAt).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleParticipant(p.id, p.isActive)}
                      disabled={togglingId === p.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        p.isActive
                          ? "bg-red-900/50 text-red-400 hover:bg-red-900"
                          : "bg-green-900/50 text-green-400 hover:bg-green-900"
                      }`}
                    >
                      {togglingId === p.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : p.isActive ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {p.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#A1A1AA]">
                    No hay participantes registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sync History */}
      <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6">
        <h2 className="mb-4 text-xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
          Historial de Sincronización
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272A] text-left text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Participante</th>
                <th className="pb-3 pr-4">Inicio</th>
                <th className="pb-3 pr-4">Fin</th>
                <th className="pb-3 pr-4">Fetched</th>
                <th className="pb-3 pr-4">Stored</th>
                <th className="pb-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]">
              {syncRuns.map((sr) => (
                <tr key={sr.id} className="text-[#F5F5F5]">
                  <td className="py-3 pr-4">{getStatusIcon(sr.status)}</td>
                  <td className="py-3 pr-4 font-medium">{sr.participantName}</td>
                  <td className="py-3 pr-4 text-xs text-[#A1A1AA]">{formatDate(sr.startedAt)}</td>
                  <td className="py-3 pr-4 text-xs text-[#A1A1AA]">{formatDate(sr.finishedAt)}</td>
                  <td className="py-3 pr-4 font-mono">{sr.activitiesFetched}</td>
                  <td className="py-3 pr-4 font-mono">{sr.activitiesStored}</td>
                  <td className="py-3 text-xs text-red-400 max-w-[200px] truncate">
                    {sr.errorMessage || "—"}
                  </td>
                </tr>
              ))}
              {syncRuns.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#A1A1AA]">
                    No hay registros de sincronización
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
