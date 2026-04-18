import { NextResponse } from "next/server";
import { getAuthUrl } from "@/services/strava/strava-auth-service";

export async function GET() {
  try {
    // Generate a random state for CSRF protection
    const state = crypto.randomUUID();
    const authUrl = getAuthUrl(state);

    // Store state in a cookie so callback can verify it
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("strava_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate Strava auth URL" },
      { status: 500 }
    );
  }
}
