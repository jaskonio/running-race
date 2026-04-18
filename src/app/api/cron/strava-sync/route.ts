import { NextRequest, NextResponse } from "next/server";
import { syncAllParticipants } from "@/services/strava/strava-sync-service";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[sync] Strava sync triggered");

  try {
    // Validate cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[sync] Unauthorized attempt — invalid or missing CRON_SECRET");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[sync] Starting sync for all active participants...");
    const results = await syncAllParticipants();

    const hasErrors = results.some((r) => !r.success);
    const durationMs = Date.now() - startTime;

    console.log(
      `[sync] Completed in ${durationMs}ms — ${results.length} participants, ` +
      `${results.filter((r) => r.success).length} ok, ${results.filter((r) => !r.success).length} failed`
    );

    for (const r of results) {
      if (r.success) {
        console.log(`[sync] ✅ ${r.name}: fetched=${r.activitiesFetched}, stored=${r.activitiesStored}`);
      } else {
        console.error(`[sync] ❌ ${r.name}: ${r.errorMessage}`);
      }
    }

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
    const durationMs = Date.now() - startTime;
    console.error("[sync] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
        durationMs,
      },
      { status: 500 }
    );
  }
}
