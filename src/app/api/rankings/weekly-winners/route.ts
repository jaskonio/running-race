import { NextResponse } from "next/server";
import { getWeeklyWinners } from "@/services/stats/rankings-service";

export async function GET() {
  try {
    const data = await getWeeklyWinners();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching weekly winners:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch weekly winners" },
      { status: 500 }
    );
  }
}
