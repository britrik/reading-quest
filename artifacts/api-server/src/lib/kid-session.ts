/**
 * Signed session cookies for kid-facing routes.
 *
 * Cookie format: base64url(JSON{pid,iat}).hmac_hex
 * The HMAC-SHA256 signature binds the profile ID server-side so that
 * no caller can impersonate another child by tampering with the cookie.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

const COOKIE_NAME = "rq_session";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Resolve the signing secret. In production we require an explicit env var;
 * in dev we fall back to a fixed string so the onboarding flow still works.
 */
function getSecret(): string {
  const secret =
    process.env.SESSION_SECRET ??
    process.env.GROWNUPS_TOKEN_SECRET ??
    (IS_PROD ? undefined : "dev-only-session-secret-change-me");
  if (!secret) {
    throw new Error(
      "SESSION_SECRET or GROWNUPS_TOKEN_SECRET must be set in production",
    );
  }
  return secret;
}

/** Sign an arbitrary payload string with HMAC-SHA256. */
function signPayload(payload: string): string {
  const secret = getSecret();
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Verify a payload against an expected signature (timing-safe). */
function verifyPayload(payload: string, signature: string): boolean {
  const expected = signPayload(payload);
  const bufA = Buffer.from(signature, "hex");
  const bufB = Buffer.from(expected, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Encode a cookie value: base64url(payload).hmac_hex */
function encodeCookieValue(data: { pid: number; iat: number }): string {
  const payload = JSON.stringify(data);
  const b64 = Buffer.from(payload, "utf-8").toString("base64url");
  const sig = signPayload(b64);
  return `${b64}.${sig}`;
}

/** Decode and verify a cookie value. Returns the profile ID or null. */
function decodeCookieValue(raw: string): number | null {
  const dotIdx = raw.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const b64 = raw.slice(0, dotIdx);
  const sig = raw.slice(dotIdx + 1);
  if (!verifyPayload(b64, sig)) return null;
  try {
    const json = Buffer.from(b64, "base64url").toString("utf-8");
    const data = JSON.parse(json) as { pid?: unknown; iat?: unknown };
    if (typeof data.pid === "number" && Number.isFinite(data.pid) && data.pid > 0) {
      return data.pid;
    }
  } catch {
    // malformed — treat as invalid
  }
  return null;
}

/** Cookie options shared between set and clear. */
function cookieOptions(): Record<string, unknown> {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/api",
    secure: IS_PROD,
  };
}

/**
 * Issue a signed session cookie that binds the given profile ID.
 */
export function createSessionCookie(res: Response, profileId: number): void {
  const value = encodeCookieValue({ pid: profileId, iat: Date.now() });
  res.cookie(COOKIE_NAME, value, cookieOptions());
}

/**
 * Clear the session cookie (e.g. on profile deselection).
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

/**
 * Extract the authenticated profile ID from the signed session cookie.
 * Returns `null` when the cookie is missing or the signature is invalid.
 */
export function getAuthenticatedProfileId(req: Request): number | null {
  const raw = req.cookies?.[COOKIE_NAME];
  if (typeof raw !== "string" || raw.length === 0) return null;
  return decodeCookieValue(raw);
}

/**
 * Check whether a session cookie is present (without verifying it).
 * Useful for distinguishing "never selected a profile" from "selected but invalid".
 */
export function isSessionCookiePresent(req: Request): boolean {
  const raw = req.cookies?.[COOKIE_NAME];
  return typeof raw === "string" && raw.length > 0;
}
