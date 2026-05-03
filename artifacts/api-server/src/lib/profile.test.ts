import { describe, it, expect } from "vitest";
import {
  xpForNextLevel,
  xpProgressPercent,
  moodFromHappiness,
} from "./profile";

describe("xpForNextLevel", () => {
  it("scales with level", () => {
    expect(xpForNextLevel(1)).toBe(50);
    expect(xpForNextLevel(2)).toBe(100);
    expect(xpForNextLevel(5)).toBe(250);
  });
});

describe("xpProgressPercent", () => {
  it("returns floored percentage", () => {
    expect(xpProgressPercent(0, 1)).toBe(0);
    expect(xpProgressPercent(25, 1)).toBe(50);
    expect(xpProgressPercent(50, 1)).toBe(100);
  });
  it("clamps above 100", () => {
    expect(xpProgressPercent(999, 1)).toBe(100);
  });
  it("clamps below 0", () => {
    expect(xpProgressPercent(-10, 1)).toBe(0);
  });
});

describe("moodFromHappiness", () => {
  it("ecstatic at 85+", () => {
    expect(moodFromHappiness(95)).toBe("ecstatic");
    expect(moodFromHappiness(85)).toBe("ecstatic");
  });
  it("happy 60-84", () => {
    expect(moodFromHappiness(70)).toBe("happy");
    expect(moodFromHappiness(60)).toBe("happy");
    expect(moodFromHappiness(84)).toBe("happy");
  });
  it("okay 30-59", () => {
    expect(moodFromHappiness(30)).toBe("okay");
    expect(moodFromHappiness(59)).toBe("okay");
  });
  it("lonely below 30", () => {
    expect(moodFromHappiness(0)).toBe("lonely");
    expect(moodFromHappiness(29)).toBe("lonely");
  });
});
