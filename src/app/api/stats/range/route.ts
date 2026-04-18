import { NextRequest, NextResponse } from "next/server";
import { getRangeStats } from "@/services/stats/rankings-service";
import { parseISO, isAfter, startOfDay, endOfDay } from "date-fns";
import { getChallengeStart, getChallengeEnd } from "@/lib/date";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Validate required parameters
    if (!fromParam || !toParam) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: from, to" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromParam) || !dateRegex.test(toParam)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    const from = parseISO(fromParam);
    const to = parseISO(toParam);

    // Validate from <= to
    if (isAfter(from, to)) {
      return NextResponse.json(
        {
          success: false,
          error: "'from' date must be before or equal to 'to' date",
        },
        { status: 400 }
      );
    }

    // Enforce challenge year boundaries
    const effectiveFrom = isAfter(getChallengeStart(), from)
      ? getChallengeStart()
      : from;
    const effectiveTo = isAfter(to, getChallengeEnd())
      ? getChallengeEnd()
      : to;

    const data = await getRangeStats(effectiveFrom, effectiveTo);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching range stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch range statistics" },
      { status: 500 }
    );
  }
}
