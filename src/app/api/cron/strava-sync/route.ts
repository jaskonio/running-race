import { NextRequest, NextResponse } from "next/server";
import { syncAllParticipants } from "@/services/strava/strava-sync-service";

export async function POST(request: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const results = await syncAllParticipants();

    const hasErrors = results.some((r) => !r.success);

    return NextResponse.json(
      {
        success: !hasErrors,
        data: results,
        syncedAt: new Date().toISOString(),
      },
      { status: hasErrors ? 207 : 200 }
    );
  } catch (error) {
    console.error("Strava sync error:", error);
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
