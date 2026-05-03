import type { Request, Response } from "express";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Grown-ups gate. In production we require an exact-token match against the
 * issued token from /api/grownups/auth (which we cannot import here without
 * a circular dep, so we accept any value that starts with "grownup:" plus
 * the configured secret). In dev/test we accept any token starting with
 * "grownup:" so integration tests can mint their own.
 */
export function isGrownupAuthorized(req: Request): boolean {
  const provided = req.header("x-grownup-token");
  if (!provided) return false;
  if (IS_PROD) {
    const secret = process.env.GROWNUPS_TOKEN_SECRET;
    if (!secret) return false;
    return provided === `grownup:${secret}`;
  }
  return provided.startsWith("grownup:");
}

export function requireGrownup(req: Request, res: Response): boolean {
  if (!isGrownupAuthorized(req)) {
    res.status(401).json({ error: "Grown-ups passcode required" });
    return false;
  }
  return true;
}
