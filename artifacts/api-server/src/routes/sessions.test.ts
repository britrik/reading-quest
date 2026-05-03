import { describe, it, expect } from "vitest";
import { rewardForChapter } from "./sessions";

describe("rewardForChapter", () => {
  it("uses 5 + sortIndex gems with 1 star and 10 xp", () => {
    expect(rewardForChapter(0)).toEqual({ gemsAwarded: 5, starsAwarded: 1, xpAwarded: 10 });
    expect(rewardForChapter(2)).toEqual({ gemsAwarded: 7, starsAwarded: 1, xpAwarded: 10 });
    expect(rewardForChapter(5)).toEqual({ gemsAwarded: 10, starsAwarded: 1, xpAwarded: 10 });
  });
});
