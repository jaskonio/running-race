import { NextResponse } from "next/server";
import { getAuthUrl } from "@/services/strava/strava-auth-service";
import { buildStateWithSignature } from "@/lib/oauth-state";

export async function GET() {
  try {
    const state = buildStateWithSignature();
    const authUrl = getAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate Strava auth URL" },
      { status: 500 }
    );
  }
}
