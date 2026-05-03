import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";

vi.mock("@workspace/api-client-react", () => ({
  useGetChapter: vi.fn(),
  useGetActiveSession: vi.fn(),
  useStartSession: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useHeartbeatSession: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  usePauseSession: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useFinishSession: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useLogWordHelp: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  getGetMeQueryKey: () => ["me"],
  getGetActiveSessionQueryKey: () => ["active-session"],
  getGetStoryQueryKey: (id: number) => ["story", id],
}));

import {
  useGetChapter,
  useGetActiveSession,
  useStartSession,
  useLogWordHelp,
} from "@workspace/api-client-react";
import Session from "./Session";

const chapterFixture = {
  id: 1,
  storyId: 2,
  sortIndex: 1,
  chapterCount: 3,
  title: "Into the woods",
  sceneImageUrl: "/images/reading-quest/scene-forest.png",
  paragraphs: ["You step into the glowing clearing.", "A fox waves a paw."],
  tappableWords: [
    { key: "glowing", word: "glowing", syllables: ["glow", "ing"], reaction: "Bright!" },
    { key: "fox", word: "fox", syllables: ["fox"], reaction: "Hi fox!" },
  ],
  nextChapterId: 2,
};

describe("Session page", () => {
  beforeEach(() => {
    vi.mocked(useGetChapter).mockReset();
    vi.mocked(useGetActiveSession).mockReset();
    vi.mocked(useStartSession).mockReset().mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
    vi.mocked(useLogWordHelp).mockReset().mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  });

  it("starts a new session when none is active for this chapter", async () => {
    const startMutate = vi.fn();
    vi.mocked(useStartSession).mockReturnValue({ mutate: startMutate, isPending: false } as never);
    vi.mocked(useGetChapter).mockReturnValue({ data: chapterFixture, isLoading: false, error: null } as never);
    vi.mocked(useGetActiveSession).mockReturnValue({ data: null, isLoading: false, error: null } as never);

    renderWithProviders(<Session />, { initialPath: "/story/2/chapter/1", routePattern: "/story/:storyId/chapter/:chapterId" });
    await waitFor(() => {
      expect(startMutate).toHaveBeenCalled();
      const arg = startMutate.mock.calls[0][0] as { data: { chapterId: number } };
      expect(arg.data.chapterId).toBe(1);
    });
  });

  it("renders the help-mode toggle and chapter paragraphs once loaded", async () => {
    vi.mocked(useStartSession).mockReturnValue({
      mutate: (_v: unknown, opts?: { onSuccess?: (s: { id: number }) => void }) => opts?.onSuccess?.({ id: 99 }),
      isPending: false,
    } as never);
    vi.mocked(useGetChapter).mockReturnValue({ data: chapterFixture, isLoading: false, error: null } as never);
    vi.mocked(useGetActiveSession).mockReturnValue({ data: null, isLoading: false, error: null } as never);

    const { getAllByText } = renderWithProviders(<Session />, { initialPath: "/story/2/chapter/1", routePattern: "/story/:storyId/chapter/:chapterId" });

    await waitFor(() => {
      expect(getAllByText(/stuck on a word/i).length).toBeGreaterThan(0);
      expect(document.body.textContent).toMatch(/glowing clearing|fox/i);
    });
  });

  it("shows error state when chapter fetch fails", () => {
    vi.mocked(useGetChapter).mockReturnValue({ data: undefined, isLoading: false, error: new Error("x") } as never);
    vi.mocked(useGetActiveSession).mockReturnValue({ data: null, isLoading: false, error: null } as never);
    renderWithProviders(<Session />, { initialPath: "/story/2/chapter/1", routePattern: "/story/:storyId/chapter/:chapterId" });
    expect(document.body.textContent).toMatch(/resting|try again|oops/i);
  });
});
