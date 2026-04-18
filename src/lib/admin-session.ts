import { createHmac, timingSafeEqual } from "crypto";

/**
 * Admin session using signed cookies.
 * Reuses the existing Strava OAuth flow — when the callback detects
 * the athlete ID matches ADMIN_ATHLETE_ID, it sets an admin cookie.
 */

const ADMIN_COOKIE_NAME = "rc2026_admin";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSigningKey(): string {
  const key = process.env.CRON_SECRET;
  if (!key) throw new Error("CRON_SECRET is required for admin session signing");
  return key;
}

function hmac(data: string): string {
  return createHmac("sha256", getSigningKey()).update(data).digest("hex");
}

/**
 * Build a signed admin session token.
 * Format: `<athleteId>.<timestamp>.<signature>`
 */
export function createAdminToken(athleteId: string): string {
  const timestamp = Date.now().toString(36);
  const payload = `${athleteId}.${timestamp}`;
  const signature = hmac(payload);
  return `${payload}.${signature}`;
}

/**
 * Verify an admin session token.
 * Checks signature and expiration.
 */
export function verifyAdminToken(token: string): { valid: boolean; athleteId: string | null } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false, athleteId: null };

    const [athleteId, timestampStr, signature] = parts;
    const payload = `${athleteId}.${timestampStr}`;

    // Verify signature
    const expectedSignature = hmac(payload);
    if (
      !timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      )
    ) {
      return { valid: false, athleteId: null };
    }

    // Check expiration
    const timestamp = parseInt(timestampStr, 36);
    const elapsed = Date.now() - timestamp;
    if (elapsed > SESSION_DURATION_MS || elapsed < 0) {
      return { valid: false, athleteId: null };
    }

    return { valid: true, athleteId };
  } catch {
    return { valid: false, athleteId: null };
  }
}

export { ADMIN_COOKIE_NAME };
