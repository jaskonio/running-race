import { NextResponse } from "next/server";
import { getMonthlyStats } from "@/services/stats/monthly-stats-service";

export async function GET() {
  try {
    const data = await getMonthlyStats();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch monthly statistics" },
      { status: 500 }
    );
  }
}
