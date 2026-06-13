export type FontSize = "small" | "medium" | "large";
export type Soundscape = "none" | "forest" | "rain" | "ocean";
export type LanguageVariant = "en-GB" | "en-US";
export type Liveliness = "quiet" | "cozy" | "lively";

export const LANGUAGE_VARIANTS: readonly LanguageVariant[] = ["en-GB", "en-US"];

export interface Preferences {
  fontSize: FontSize;
  highContrast: boolean;
  reducedMotion: boolean;
  voiceSpeed: number;
  soundscape: Soundscape;
  soundEnabled: boolean;
  sessionLengthSuggestionMin: number;
  breakReminders: boolean;
  languageVariant: LanguageVariant;
  liveliness: Liveliness;
}

export const DEFAULT_PREFERENCES: Preferences = {
  fontSize: "medium",
  highContrast: false,
  reducedMotion: false,
  voiceSpeed: 0.9,
  soundscape: "forest",
  soundEnabled: true,
  sessionLengthSuggestionMin: 15,
  breakReminders: true,
  languageVariant: "en-GB",
  liveliness: "cozy",
};

/**
 * Apply visual preferences to the documentElement. Idempotent.
 * Tests assert via the data-* attributes set here.
 */
export function applyPreferencesToDocument(prefs: Preferences): void {
  const el = document.documentElement;
  el.setAttribute("data-font-size", prefs.fontSize);
  el.setAttribute("data-high-contrast", String(prefs.highContrast));
  el.setAttribute("data-reduced-motion", String(prefs.reducedMotion));
  el.classList.toggle("rq-font-small", prefs.fontSize === "small");
  el.classList.toggle("rq-font-medium", prefs.fontSize === "medium");
  el.classList.toggle("rq-font-large", prefs.fontSize === "large");
  el.classList.toggle("rq-high-contrast", prefs.highContrast);
  el.classList.toggle("rq-reduced-motion", prefs.reducedMotion);
}

export async function fetchPreferences(profileId: number | null): Promise<Preferences> {
  const headers: Record<string, string> = {};
  if (profileId !== null) headers["x-profile-id"] = String(profileId);
  const res = await fetch("/api/preferences", { headers });
  if (!res.ok) return DEFAULT_PREFERENCES;
  return (await res.json()) as Preferences;
}

export async function savePreferences(
  profileId: number | null,
  patch: Partial<Preferences>,
): Promise<Preferences> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (profileId !== null) headers["x-profile-id"] = String(profileId);
  const res = await fetch("/api/preferences", {
    method: "PUT",
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`save preferences failed: ${res.status}`);
  return (await res.json()) as Preferences;
}
