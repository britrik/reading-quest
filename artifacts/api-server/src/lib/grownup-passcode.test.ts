import { describe, it, expect, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  validateGrownupPasscode,
  resolveGrownupPasscode,
  GrownupPasscodeConfigError,
  MIN_PASSCODE_LENGTH,
} from "./grownup-passcode";

const STRONG = "maple-otter-42";

describe("validateGrownupPasscode", () => {
  it("rejects the old default 1234 (AC1)", () => {
    expect(validateGrownupPasscode("1234")).not.toBeNull();
  });

  it.each(["0000", "123456", "000000", "password", "Passcode", "aaaaaa", "12345", ""])(
    "rejects weak passcode %j (AC2)",
    (p) => {
      expect(validateGrownupPasscode(p)).not.toBeNull();
    },
  );

  it("accepts a strong passcode", () => {
    expect(validateGrownupPasscode(STRONG)).toBeNull();
  });

  it("requires at least MIN_PASSCODE_LENGTH characters", () => {
    expect(MIN_PASSCODE_LENGTH).toBeGreaterThanOrEqual(6);
    expect(validateGrownupPasscode("x7".repeat(3).slice(0, MIN_PASSCODE_LENGTH - 1))).not.toBeNull();
  });
});

describe("validateGrownupPasscode counts Unicode code points", () => {
  it("rejects three emoji (6 UTF-16 units, 3 characters) as too short", () => {
    expect(validateGrownupPasscode("\u{1F600}\u{1F600}\u{1F600}")).toMatch(/at least/);
  });
  it("rejects six repeated emoji as a single repeated character", () => {
    expect(validateGrownupPasscode("\u{1F600}".repeat(6))).toMatch(/repeated/);
  });
  it("accepts six distinct emoji", () => {
    expect(validateGrownupPasscode("\u{1F600}\u{1F680}\u{1F308}\u{1F98A}\u{1F333}\u{1F4DA}")).toBeNull();
  });
});

describe("resolveGrownupPasscode", () => {
  it.each(["development", "test", "production"])(
    "throws when GROWNUPS_PASSCODE=1234 in %s (AC1)",
    (NODE_ENV) => {
      expect(() => resolveGrownupPasscode({ NODE_ENV, GROWNUPS_PASSCODE: "1234" })).toThrow(
        GrownupPasscodeConfigError,
      );
    },
  );

  it("throws on other weak env passcodes (AC2)", () => {
    expect(() => resolveGrownupPasscode({ NODE_ENV: "production", GROWNUPS_PASSCODE: "123456" })).toThrow(
      GrownupPasscodeConfigError,
    );
  });

  it("returns a strong env passcode, trimmed (AC3)", () => {
    const r = resolveGrownupPasscode({ NODE_ENV: "production", GROWNUPS_PASSCODE: `  ${STRONG}\n` });
    expect(r).toEqual({ passcode: STRONG, source: "env" });
  });

  it("throws in production when GROWNUPS_PASSCODE is unset or blank (AC4)", () => {
    expect(() => resolveGrownupPasscode({ NODE_ENV: "production" })).toThrow(GrownupPasscodeConfigError);
    expect(() => resolveGrownupPasscode({ NODE_ENV: "production", GROWNUPS_PASSCODE: "   " })).toThrow(
      GrownupPasscodeConfigError,
    );
  });

  it("generates a random passcode in dev when unset and logs it once (AC5)", () => {
    const warn = vi.fn();
    const a = resolveGrownupPasscode({ NODE_ENV: "development" }, { warn });
    const b = resolveGrownupPasscode({ NODE_ENV: "development" }, { warn: () => {} });
    expect(a.source).toBe("generated");
    expect(a.passcode).not.toBe("1234");
    expect(a.passcode.length).toBeGreaterThanOrEqual(MIN_PASSCODE_LENGTH);
    expect(validateGrownupPasscode(a.passcode)).toBeNull();
    expect(a.passcode).not.toBe(b.passcode);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain(a.passcode);
  });
});

describe("no hard-coded default passcode in server source (AC2 static guard)", () => {
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  }

  it("has no `|| \"1234\"` fallback outside tests", () => {
    const srcDir = join(__dirname, "..");
    const offenders = walk(srcDir)
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .filter((f) => /GROWNUPS_PASSCODE\s*(\|\||\?\?)\s*["'`]/.test(readFileSync(f, "utf-8")));
    expect(offenders).toEqual([]);
  });
});

describe("Playwright config passes the passcode without shell interpolation", () => {
  it("does not interpolate GROWNUPS_PASSCODE into a webServer command", () => {
    const config = readFileSync(join(__dirname, "../../../../playwright.config.ts"), "utf-8");
    const commands = [...config.matchAll(/command:\s*(["'`])([\s\S]*?)\1/g)].map((m) => m[2]);
    expect(commands.length).toBeGreaterThan(0);
    for (const cmd of commands) {
      expect(cmd).not.toMatch(/\$\{/);
      expect(cmd).not.toMatch(/GROWNUPS_PASSCODE/);
    }
    expect(config).toMatch(/env:\s*\{[\s\S]*GROWNUPS_PASSCODE: E2E_GROWNUPS_PASSCODE/);
  });
});
