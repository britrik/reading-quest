import { describe, it, expect } from "vitest";
import { cn, getImageUrl } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("dedupes conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("getImageUrl", () => {
  it("returns empty string for falsy paths", () => {
    expect(getImageUrl(null)).toBe("");
    expect(getImageUrl(undefined)).toBe("");
    expect(getImageUrl("")).toBe("");
  });
  it("normalizes leading slash on the path", () => {
    expect(getImageUrl("img/x.png")).toBe(getImageUrl("/img/x.png"));
  });
  it("never produces a double slash between base and path", () => {
    const result = getImageUrl("/img/x.png");
    expect(result.includes("//")).toBe(false);
    expect(result.endsWith("/img/x.png")).toBe(true);
  });
});
