import { NextRequest, NextResponse } from "next/server";
import { syncAllParticipants } from "@/services/strava/strava-sync-service";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify admin session via cookie
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const { valid: isAdmin } = adminToken
      ? verifyAdminToken(adminToken)
      : { valid: false };

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden — admin only" },
        { status: 403 }
      );
    }

    console.log("[admin-sync] Admin-triggered sync");

    const results = await syncAllParticipants();

    const hasErrors = results.some((r) => !r.success);
    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: !hasErrors,
        data: results,
        syncedAt: new Date().toISOString(),
        durationMs,
      },
      { status: hasErrors ? 207 : 200 }
    );
  } catch (error) {
    console.error("[admin-sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
