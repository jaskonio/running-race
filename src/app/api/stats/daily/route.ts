import { NextResponse } from "next/server";
import { getDailyCumulativeStats } from "@/services/stats/daily-stats-service";

export async function GET() {
  try {
    const data = await getDailyCumulativeStats();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch daily statistics" },
      { status: 500 }
    );
  }
}
