import { NextResponse } from "next/server";
import { getWeeklyStats } from "@/services/stats/weekly-stats-service";

export async function GET() {
  try {
    const data = await getWeeklyStats();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch weekly statistics" },
      { status: 500 }
    );
  }
}
