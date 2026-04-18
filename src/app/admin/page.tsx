import prisma from "@/lib/prisma";
import Link from "next/link";
import AdminPanel from "@/components/admin/AdminPanel";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-session";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const ADMIN_ATHLETE_ID = process.env.ADMIN_ATHLETE_ID;

export default async function AdminPage() {
  // Check admin cookie
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const { valid: isAdmin } = adminToken
    ? verifyAdminToken(adminToken)
    : { valid: false };

  // Not admin → show login
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="max-w-md rounded-2xl border border-[#27272A] bg-[#18181B] p-8 text-center">
          <div className="mb-4 text-5xl">🔐</div>
          <h1 className="mb-2 text-2xl font-bold text-[#F5F5F5] font-[family-name:var(--font-heading)]">
            Admin Panel
          </h1>
          <p className="mb-6 text-sm text-[#A1A1AA]">
            Iniciá sesión con Strava para acceder al panel de administración.
          </p>
          <a
            href="/api/strava/connect?from=admin"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFD600] px-6 py-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#FFEA00]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Iniciar sesión con Strava
          </a>
          <div className="mt-6">
            <Link
              href="/"
              className="text-sm text-[#A1A1AA] transition-colors hover:text-[#F5F5F5]"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin authenticated — load data
  const [participants, recentSyncRuns] = await Promise.all([
    prisma.participant.findMany({ orderBy: { name: "asc" } }),
    prisma.syncRun.findMany({
      take: 20,
      orderBy: { startedAt: "desc" },
      include: { participant: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#27272A]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-bold text-[#FFD600] font-[family-name:var(--font-heading)]">
                RC2026
              </a>
              <span className="rounded-full bg-[#FFD600] px-3 py-1 text-xs font-bold text-[#0A0A0A]">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-sm text-[#A1A1AA] transition-colors hover:text-[#F5F5F5]"
              >
                Dashboard
              </a>
              <a
                href="/api/admin/logout"
                className="rounded-lg border border-[#27272A] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] transition-colors hover:border-[#FFD600] hover:text-[#FFD600]"
              >
                Cerrar sesión
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminPanel
          participants={participants.map((p) => ({
            id: p.id,
            name: p.name,
            stravaAthleteId: p.stravaAthleteId,
            isActive: p.isActive,
            tokenExpiresAt: p.tokenExpiresAt.toISOString(),
          }))}
          syncRuns={recentSyncRuns.map((sr) => ({
            id: sr.id,
            participantName: sr.participant?.name ?? "System",
            status: sr.status,
            startedAt: sr.startedAt.toISOString(),
            finishedAt: sr.finishedAt?.toISOString() ?? null,
            activitiesFetched: sr.activitiesFetched,
            activitiesStored: sr.activitiesStored,
            errorMessage: sr.errorMessage,
          }))}
        />
      </main>
    </div>
  );
}
