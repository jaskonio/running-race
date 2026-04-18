import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/services/strava/strava-auth-service";
import prisma from "@/lib/prisma";
import { getEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Verify CSRF state
    const storedState = request.cookies.get("strava_oauth_state")?.value;
    if (!state || state !== storedState) {
      return NextResponse.json(
        { success: false, error: "Invalid OAuth state — possible CSRF attack" },
        { status: 400 }
      );
    }

    // User denied authorization
    if (error) {
      return NextResponse.redirect(
        `${getEnv().NEXT_PUBLIC_APP_URL}?error=access_denied`
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code);

    // Create or update participant
    const athlete = tokenResponse.athlete;
    const participantName = `${athlete.firstname} ${athlete.lastname}`.trim();

    const participant = await prisma.participant.upsert({
      where: { stravaAthleteId: String(athlete.id) },
      create: {
        name: participantName,
        stravaAthleteId: String(athlete.id),
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt: new Date(tokenResponse.expires_at * 1000),
        isActive: true,
      },
      update: {
        name: participantName,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt: new Date(tokenResponse.expires_at * 1000),
        isActive: true,
      },
    });

    // Redirect to dashboard with success
    return NextResponse.redirect(
      `${getEnv().NEXT_PUBLIC_APP_URL}?connected=${participant.name}`
    );
  } catch (error) {
    console.error("Strava OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "/"}?error=oauth_failed`
    );
  }
}
