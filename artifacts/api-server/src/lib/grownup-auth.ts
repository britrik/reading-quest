import type { Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";

const IS_PROD = process.env.NODE_ENV === "production";

export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    // Still do a comparison to avoid leaking length info via timing,
    // but always return false since the values differ.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

if (IS_PROD && !process.env.GROWNUPS_TOKEN_SECRET) {
  throw new Error("GROWNUPS_TOKEN_SECRET environment variable is required in production.");
}

/**
 * The single grown-ups bearer token, issued by POST /api/grownups/auth after a
 * correct passcode. Without GROWNUPS_TOKEN_SECRET (dev/test only) it is random
 * per process, so it can only be obtained through the auth endpoint.
 */
export const GROWNUP_TOKEN = `grownup:${
  process.env.GROWNUPS_TOKEN_SECRET || randomBytes(32).toString("hex")
}`;

/**
 * Grown-ups gate, shared by every grown-ups route. Exact, timing-safe match
 * against the issued token in every environment: a forged "grownup:*" value
 * is rejected in dev/test as well as production.
 */
export function isGrownupAuthorized(req: Request): boolean {
  const provided = req.header("x-grownup-token");
  return typeof provided === "string" && safeCompare(provided, GROWNUP_TOKEN);
}

export function requireGrownup(req: Request, res: Response): boolean {
  if (!isGrownupAuthorized(req)) {
    res.status(401).json({ error: "Grown-ups passcode required" });
    return false;
  }
  return true;
}
