import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";

vi.mock("@workspace/api-client-react", () => ({
  useGetMe: vi.fn(),
  useListWorlds: vi.fn(),
  useGetActiveSession: vi.fn(),
}));

import { useGetMe, useListWorlds, useGetActiveSession } from "@workspace/api-client-react";
import Home from "./Home";

const meFixture = {
  id: 1, name: "Alex", gems: 24, stars: 12,
  petLevel: 3, petXp: 100, petXpForNextLevel: 150, petXpProgressPercent: 66,
  fullness: 70, happiness: 75,
};
const worldsFixture = [
  { id: 1, slug: "forest", name: "Whispering Forest", blurb: "Soft path", difficulty: 1, difficultyLabel: "Gentle Path", thumbnailUrl: "/x.png", accentColor: "#A5FFD6", chipColor: "#A5FFD6", chipTextColor: "#0F766E" },
  { id: 2, slug: "sky", name: "Cloud Ruins", blurb: "Up high", difficulty: 2, difficultyLabel: "Breezy", thumbnailUrl: "/x.png", accentColor: "#84DCC6", chipColor: "#84DCC6", chipTextColor: "#1E40AF" },
];

describe("Home page", () => {
  beforeEach(() => {
    vi.mocked(useGetMe).mockReset();
    vi.mocked(useListWorlds).mockReset();
    vi.mocked(useGetActiveSession).mockReset();
  });

  it("shows the loader while data is loading", () => {
    vi.mocked(useGetMe).mockReturnValue({ data: undefined, isLoading: true, error: null } as never);
    vi.mocked(useListWorlds).mockReturnValue({ data: undefined, isLoading: true, error: null } as never);
    vi.mocked(useGetActiveSession).mockReturnValue({ data: undefined, isLoading: true, error: null } as never);
    renderWithProviders(<Home />);
    expect(document.body.textContent).toMatch(/setting up|walking|loading/i);
  });

  it("shows an error state when fetching fails", () => {
    vi.mocked(useGetMe).mockReturnValue({ data: undefined, isLoading: false, error: new Error("boom") } as never);
    vi.mocked(useListWorlds).mockReturnValue({ data: undefined, isLoading: false, error: null } as never);
    vi.mocked(useGetActiveSession).mockReturnValue({ data: undefined, isLoading: false, error: null } as never);
    renderWithProviders(<Home />);
    expect(document.body.textContent).toMatch(/resting|try again|oops/i);
  });

  it("renders the HUD and worlds when data loads", async () => {
    vi.mocked(useGetMe).mockReturnValue({ data: meFixture, isLoading: false, error: null } as never);
    vi.mocked(useListWorlds).mockReturnValue({ data: worldsFixture, isLoading: false, error: null } as never);
    vi.mocked(useGetActiveSession).mockReturnValue({ data: null, isLoading: false, error: null } as never);
    renderWithProviders(<Home />);
    await waitFor(() => {
      expect(screen.getByText("24")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText(/Whispering Forest/i)).toBeInTheDocument();
      expect(screen.getByText(/Cloud Ruins/i)).toBeInTheDocument();
    });
  });

  it("shows continue card when an active session exists", async () => {
    vi.mocked(useGetMe).mockReturnValue({ data: meFixture, isLoading: false, error: null } as never);
    vi.mocked(useListWorlds).mockReturnValue({ data: worldsFixture, isLoading: false, error: null } as never);
    vi.mocked(useGetActiveSession).mockReturnValue({
      data: { id: 7, chapterId: 4, storyId: 2, status: "active" },
      isLoading: false,
      error: null,
    } as never);
    renderWithProviders(<Home />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/continue your adventure/i);
    });
  });
});
