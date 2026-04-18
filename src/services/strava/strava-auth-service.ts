import axios from "axios";
import { getEnv } from "@/lib/env";
import type { StravaTokenResponse } from "@/types/participant";

const STRAVA_AUTH_BASE = "https://www.strava.com/oauth";

function getStravaConfig() {
  const env = getEnv();
  return {
    clientId: env.STRAVA_CLIENT_ID,
    clientSecret: env.STRAVA_CLIENT_SECRET,
    redirectUri: env.STRAVA_REDIRECT_URI,
  };
}

/**
 * Generate the Strava OAuth authorization URL
 */
export function getAuthUrl(state: string): string {
  const config = getStravaConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: "activity:read_all",
    state,
  });

  return `${STRAVA_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<StravaTokenResponse> {
  const config = getStravaConfig();

  const response = await axios.post<StravaTokenResponse>(
    `${STRAVA_AUTH_BASE}/token`,
    {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
    }
  );

  return response.data;
}

/**
 * Refresh an expired access token using the refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<StravaTokenResponse> {
  const config = getStravaConfig();

  const response = await axios.post<StravaTokenResponse>(
    `${STRAVA_AUTH_BASE}/token`,
    {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }
  );

  return response.data;
}

/**
 * Check if a token is expired or will expire within the buffer period
 */
export function isTokenExpired(expiresAt: Date): boolean {
  const bufferMs = 60 * 60 * 1000; // 1 hour buffer
  return new Date(expiresAt.getTime() - bufferMs) <= new Date();
}

/**
 * Ensure a participant has a valid access token, refreshing if needed
 * Returns the current access token
 */
export async function ensureValidToken(
  participant: {
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date;
    id: string;
  },
  updateParticipant: (id: string, data: { accessToken: string; refreshToken: string; tokenExpiresAt: Date }) => Promise<void>
): Promise<string> {
  if (!isTokenExpired(participant.tokenExpiresAt)) {
    return participant.accessToken;
  }

  const tokenResponse = await refreshAccessToken(participant.refreshToken);

  await updateParticipant(participant.id, {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    tokenExpiresAt: new Date(tokenResponse.expires_at * 1000),
  });

  return tokenResponse.access_token;
}
