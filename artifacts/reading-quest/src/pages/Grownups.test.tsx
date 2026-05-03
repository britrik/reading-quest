import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";

vi.mock("@workspace/api-client-react", () => ({
  useGrownupsAuth: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useGrownupsSummary: vi.fn(),
  useGrownupsWeeklyMinutes: vi.fn(),
  useGrownupsWords: vi.fn(),
  useGrownupsFinishedStories: vi.fn(),
  useGrownupsRecentActivity: vi.fn(),
}));

import {
  useGrownupsSummary,
  useGrownupsWeeklyMinutes,
  useGrownupsWords,
  useGrownupsFinishedStories,
  useGrownupsRecentActivity,
} from "@workspace/api-client-react";
import Grownups from "./Grownups";

describe("Grownups dashboard", () => {
  beforeEach(() => {
    vi.mocked(useGrownupsSummary).mockReset();
    vi.mocked(useGrownupsWeeklyMinutes).mockReset();
    vi.mocked(useGrownupsWords).mockReset();
    vi.mocked(useGrownupsFinishedStories).mockReset();
    vi.mocked(useGrownupsRecentActivity).mockReset();
  });

  it("shows the passcode gate before authentication", () => {
    vi.mocked(useGrownupsSummary).mockReturnValue({ data: undefined, isLoading: false, error: null } as never);
    vi.mocked(useGrownupsWeeklyMinutes).mockReturnValue({ data: undefined, isLoading: false, error: null } as never);
    vi.mocked(useGrownupsWords).mockReturnValue({ data: undefined, isLoading: false, error: null } as never);
    vi.mocked(useGrownupsFinishedStories).mockReturnValue({ data: undefined, isLoading: false, error: null } as never);
    vi.mocked(useGrownupsRecentActivity).mockReturnValue({ data: undefined, isLoading: false, error: null } as never);

    renderWithProviders(<Grownups />);
    expect(document.body.textContent).toMatch(/passcode|grown[- ]?ups|enter/i);
  });

  it("renders dashboard data once a token is present in localStorage", async () => {
    localStorage.setItem("rq.grownupToken", "grownup:test-token");

    vi.mocked(useGrownupsSummary).mockReturnValue({
      data: { minutesRead: 42, sessionsCount: 5, finishedStoriesCount: 2, helpRequestsCount: 7 },
      isLoading: false, error: null,
    } as never);
    vi.mocked(useGrownupsWeeklyMinutes).mockReturnValue({
      data: [{ date: "2026-04-26", minutes: 8 }, { date: "2026-04-27", minutes: 0 }],
      isLoading: false, error: null,
    } as never);
    vi.mocked(useGrownupsWords).mockReturnValue({
      data: [{ word: "fox", helpCount: 3, lastSeenAt: "2026-04-30T12:00:00Z" }],
      isLoading: false, error: null,
    } as never);
    vi.mocked(useGrownupsFinishedStories).mockReturnValue({
      data: [{ id: 1, title: "The Glowing Clearing", worldName: "Whispering Forest", finishedAt: "2026-04-30T12:00:00Z" }],
      isLoading: false, error: null,
    } as never);
    vi.mocked(useGrownupsRecentActivity).mockReturnValue({
      data: [{ id: "a1", kind: "session", label: "Read a chapter", createdAt: "2026-04-30T12:00:00Z" }],
      isLoading: false, error: null,
    } as never);

    renderWithProviders(<Grownups />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/glowing clearing|whispering forest|fox|42/i);
    });

    localStorage.removeItem("rq.grownupToken");
  });
});
