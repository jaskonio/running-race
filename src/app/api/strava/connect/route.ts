import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/services/strava/strava-auth-service";
import { buildStateWithSignature } from "@/lib/oauth-state";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");

    const state = buildStateWithSignature();
    let authUrl = getAuthUrl(state);

    // Pass through the "from" param so callback knows where to redirect
    if (from) {
      authUrl += `&from=${encodeURIComponent(from)}`;
    }

    // Note: "from" is passed as a Strava OAuth query param.
    // Strava passes it back in the callback URL.
    // We encode it in the state instead to avoid relying on Strava passthrough.

    // Actually, Strava doesn't pass custom params back.
    // We need to encode "from" in the state itself.
    // But our state is HMAC-signed... let's use a cookie for this.

    const response = NextResponse.redirect(getAuthUrl(state));

    if (from) {
      response.cookies.set("strava_oauth_from", from, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate Strava auth URL" },
      { status: 500 }
    );
  }
}
