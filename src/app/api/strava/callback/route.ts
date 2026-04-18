import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/services/strava/strava-auth-service";
import prisma from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { verifyState } from "@/lib/oauth-state";
import { createAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-session";

const ADMIN_ATHLETE_ID = process.env.ADMIN_ATHLETE_ID;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check if this was initiated from admin page (via cookie set by connect)
    const fromAdmin = request.cookies.get("strava_oauth_from")?.value === "admin";

    // Verify CSRF state via HMAC signature (no cookies needed)
    if (!state || !verifyState(state)) {
      return NextResponse.json(
        { success: false, error: "Invalid OAuth state — possible CSRF attack" },
        { status: 400 }
      );
    }

    // User denied authorization
    if (error) {
      const redirectUrl = fromAdmin
        ? `${getEnv().NEXT_PUBLIC_APP_URL}/admin?error=access_denied`
        : `${getEnv().NEXT_PUBLIC_APP_URL}?error=access_denied`;
      return NextResponse.redirect(redirectUrl);
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
    const athleteId = String(athlete.id);
    const participantName = `${athlete.firstname} ${athlete.lastname}`.trim();

    const participant = await prisma.participant.upsert({
      where: { stravaAthleteId: athleteId },
      create: {
        name: participantName,
        stravaAthleteId: athleteId,
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

    // Determine redirect destination
    const redirectUrl = fromAdmin
      ? `${getEnv().NEXT_PUBLIC_APP_URL}/admin?connected=${encodeURIComponent(participant.name)}`
      : `${getEnv().NEXT_PUBLIC_APP_URL}?connected=${encodeURIComponent(participant.name)}`;

    const response = NextResponse.redirect(redirectUrl);

    // If this athlete is the admin, set admin session cookie
    if (ADMIN_ATHLETE_ID && athleteId === ADMIN_ATHLETE_ID) {
      const adminToken = createAdminToken(athleteId);
      response.cookies.set(ADMIN_COOKIE_NAME, adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Strava OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "/"}?error=oauth_failed`
    );
  }
}
