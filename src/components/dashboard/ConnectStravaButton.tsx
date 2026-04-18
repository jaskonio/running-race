"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConnectStravaButton() {
  const searchParams = useSearchParams();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      setNotification({
        type: "success",
        message: `¡${decodeURIComponent(connected)} se conectó correctamente!`,
      });
    } else if (error) {
      const messages: Record<string, string> = {
        access_denied: "Rechazaste la autorización de Strava.",
        oauth_failed: "Error al conectar con Strava. Intentá de nuevo.",
      };
      setNotification({
        type: "error",
        message: messages[error] || "Ocurrió un error inesperado.",
      });
    }

    if (connected || error) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-end gap-3">
      {/* Notification */}
      {notification && (
        <div
          className={`w-full rounded-xl px-4 py-3 text-sm font-medium border ${
            notification.type === "success"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {notification.type === "success" ? "✅" : "❌"} {notification.message}
        </div>
      )}

      {/* Strava connect button */}
      <a
        href="/api/strava/connect"
        className="inline-flex items-center gap-2 rounded-xl bg-[#FFD600] px-5 py-2.5 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#FFEA00]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-current"
          aria-hidden="true"
        >
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
        </svg>
        Conectar Strava
      </a>
    </div>
  );
}
