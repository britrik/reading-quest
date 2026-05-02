import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";

vi.mock("@workspace/api-client-react", () => ({
  useGetPet: vi.fn(),
  useListShopItems: vi.fn(),
  useFeedPet: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useEquipPetItem: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useTogglePetDecor: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  usePurchaseShopItem: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

import { useGetPet, useListShopItems } from "@workspace/api-client-react";
import PetDen from "./PetDen";

const petFixture = {
  level: 3, xp: 100, xpForNextLevel: 150, xpProgressPercent: 66,
  fullness: 70, happiness: 75, mood: "happy" as const,
  equippedHat: null, equippedGlow: null, decor: [],
};
const shopFixture = [
  { id: "snack.berry", kind: "snack", name: "Glow Berry", description: "yum", gemPrice: 1, fullnessBoost: 10, happinessBoost: 5, requiresPetLevel: 0, emoji: "🍓", glowColor: null, sortIndex: 0, owned: true, locked: false },
  { id: "hat.crown", kind: "hat", name: "Tiny Crown", description: "royal", gemPrice: 6, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "👑", glowColor: null, sortIndex: 10, owned: true, locked: false },
];

describe("PetDen page", () => {
  beforeEach(() => {
    vi.mocked(useGetPet).mockReset();
    vi.mocked(useListShopItems).mockReset();
  });

  it("shows loader while pet/shop are loading", () => {
    vi.mocked(useGetPet).mockReturnValue({ data: undefined, isLoading: true, error: null } as never);
    vi.mocked(useListShopItems).mockReturnValue({ data: undefined, isLoading: true, error: null } as never);
    renderWithProviders(<PetDen />);
    expect(document.body.textContent).toMatch(/opening|setting up|walking|loading/i);
  });

  it("shows error state when fetching fails", () => {
    vi.mocked(useGetPet).mockReturnValue({ data: undefined, isLoading: false, error: new Error("x") } as never);
    vi.mocked(useListShopItems).mockReturnValue({ data: undefined, isLoading: false, error: null } as never);
    renderWithProviders(<PetDen />);
    expect(document.body.textContent).toMatch(/resting|try again|oops/i);
  });

  it("renders pet stats and shop items when loaded", async () => {
    vi.mocked(useGetPet).mockReturnValue({ data: petFixture, isLoading: false, error: null } as never);
    vi.mocked(useListShopItems).mockReturnValue({ data: shopFixture, isLoading: false, error: null } as never);
    renderWithProviders(<PetDen />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/glow berry|tiny crown/i);
    });
  });
});
