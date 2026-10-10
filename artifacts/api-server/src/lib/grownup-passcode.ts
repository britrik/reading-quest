import { randomBytes } from "node:crypto";

/**
 * Grown-ups passcode configuration.
 *
 * There is deliberately no fixed default passcode. In production
 * GROWNUPS_PASSCODE must be set to a non-trivial value or the server refuses
 * to start. In development/test, if it is unset, a random per-process
 * passcode is generated and logged once so a developer can still sign in.
 */

export const MIN_PASSCODE_LENGTH = 6;

const WEAK_PASSCODES = new Set([
  "1234",
  "12345",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "654321",
  "0000",
  "000000",
  "111111",
  "121212",
  "123123",
  "abc123",
  "qwerty",
  "letmein",
  "password",
  "passcode",
  "grownups",
  "changeme",
]);

export class GrownupPasscodeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrownupPasscodeConfigError";
  }
}

/** Returns null when the passcode is acceptable, otherwise a reason. */
export function validateGrownupPasscode(passcode: string): string | null {
  // Count Unicode code points, not UTF-16 code units, so astral characters
  // (e.g. emoji) are not double-counted towards the minimum length.
  if (Array.from(passcode).length < MIN_PASSCODE_LENGTH) {
    return `must be at least ${MIN_PASSCODE_LENGTH} characters`;
  }
  if (WEAK_PASSCODES.has(passcode.toLowerCase())) {
    return "is a commonly used passcode";
  }
  if (/^(.)\1+$/su.test(passcode)) {
    return "must not be a single repeated character";
  }
  return null;
}

export interface ResolvedPasscode {
  passcode: string;
  source: "env" | "generated";
}

export interface ResolveDeps {
  /** Called once when a dev passcode is generated. Defaults to console.warn. */
  warn?: (message: string) => void;
}

export function resolveGrownupPasscode(
  env: Record<string, string | undefined>,
  deps: ResolveDeps = {},
): ResolvedPasscode {
  const raw = env.GROWNUPS_PASSCODE?.trim();
  if (raw) {
    const problem = validateGrownupPasscode(raw);
    if (problem) {
      throw new GrownupPasscodeConfigError(
        `GROWNUPS_PASSCODE ${problem}. Choose a stronger grown-ups passcode.`,
      );
    }
    return { passcode: raw, source: "env" };
  }

  if (env.NODE_ENV === "production") {
    throw new GrownupPasscodeConfigError(
      "GROWNUPS_PASSCODE environment variable is required in production.",
    );
  }

  // Dev/test only: random, unguessable, different on every start.
  const passcode = randomBytes(9).toString("base64url");
  const warn = deps.warn ?? ((m: string) => console.warn(m));
  warn(
    `[grown-ups] GROWNUPS_PASSCODE is not set; using a temporary passcode for this dev process: ${passcode}`,
  );
  return { passcode, source: "generated" };
}
