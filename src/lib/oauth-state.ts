import { createHmac, timingSafeEqual } from "crypto";

/**
 * OAuth CSRF state protection using HMAC signatures.
 * No cookies needed — the state itself contains a signed timestamp
 * that we can verify on callback.
 */

function getSigningKey(): string {
  // Use CRON_SECRET as signing key (already in env, already secret)
  const key = process.env.CRON_SECRET;
  if (!key) throw new Error("CRON_SECRET is required for OAuth state signing");
  return key;
}

function hmac(data: string): string {
  return createHmac("sha256", getSigningKey()).update(data).digest("hex");
}

/**
 * Build a state string containing a timestamp and HMAC signature.
 * Format: `<randomId>.<timestamp>.<signature>`
 */
export function buildStateWithSignature(): string {
  const randomId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const timestamp = Date.now().toString(36);
  const payload = `${randomId}.${timestamp}`;
  const signature = hmac(payload);
  return `${payload}.${signature}`;
}

/**
 * Verify that a state string has a valid signature and hasn't expired.
 * Valid for 10 minutes.
 */
export function verifyState(state: string): boolean {
  try {
    const parts = state.split(".");
    if (parts.length !== 3) return false;

    const [randomId, timestampStr, signature] = parts;
    const payload = `${randomId}.${timestampStr}`;

    // Verify signature (timing-safe comparison)
    const expectedSignature = hmac(payload);
    if (
      !timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      )
    ) {
      return false;
    }

    // Check expiration: 10 minutes
    const timestamp = parseInt(timestampStr, 36);
    const elapsed = Date.now() - timestamp;
    if (elapsed > 10 * 60 * 1000 || elapsed < 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
