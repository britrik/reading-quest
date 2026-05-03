import { useQuery } from "@tanstack/react-query";
import { fetchPreferences, type LanguageVariant } from "./preferences";
import { getActiveProfileId } from "./profile";

const dict = {
  "en-GB": {
    settingsTitle: "Cosy Settings",
    settingsOpenAria: "Open Cosy Settings",
    petDenHangout: "A cosy hangout 🏡",
    onboardingIntroSub:
      "No grades, no timer, no rush. Stories, a tiny pet, and lots of cosy.",
    glowColor: "Glow colour",
    homeContinueHeading: "Carry on your favourite tale",
    sessionRestLong: "Rest at the Campfire",
    sessionRestShort: "Rest",
    sessionSoundItOut: "Let's sound it out",
    sessionNoScoreChange: "No score change. Carry on whenever you're ready.",
    languagePickerLabel: "Language style",
    languageEnGBLabel: "British English",
    languageEnUSLabel: "American English",
    profilePickerTitle: "Tap your picture",
    profilePickerSubtitle: "No reading needed — just pick your animal!",
    profilePickerGrownupsCta: "Grown-ups: add a new reader",
    storyPickerBackToWorlds: "Back to worlds",
    storyPickerHeading: "Stories to read",
    storyPickerEmpty: "No stories here yet. Let's check another world!",
    chapterPickerBackToStories: "Back to stories",
    chapterPickerHeading: "Chapters",
    chapterPickerEmpty: "No chapters written yet.",
    chapterPickerFinished: "Finished",
    notFoundTitle: "Page not found",
    notFoundBody: "We couldn't find that page. Let's head back to the start.",
    grownupsBackToApp: "Back to app",
    profileManagerHeading: "Readers",
    profileManagerSubtitle: "Add, rename, or remove a kid profile on this device.",
    profileManagerAddReader: "Add reader",
  },
  "en-US": {
    settingsTitle: "Cozy Settings",
    settingsOpenAria: "Open Cozy Settings",
    petDenHangout: "A cozy hangout 🏡",
    onboardingIntroSub:
      "No grades, no timer, no rush. Stories, a tiny pet, and lots of cozy.",
    glowColor: "Glow color",
    homeContinueHeading: "Continue your favorite adventure",
    sessionRestLong: "Rest at Campfire",
    sessionRestShort: "Rest",
    sessionSoundItOut: "Let's sound it out",
    sessionNoScoreChange: "No score change. Keep going whenever you're ready.",
    languagePickerLabel: "Language style",
    languageEnGBLabel: "British English",
    languageEnUSLabel: "American English",
    profilePickerTitle: "Tap your picture",
    profilePickerSubtitle: "No reading needed — just pick your animal!",
    profilePickerGrownupsCta: "Grown-ups: add a new reader",
    storyPickerBackToWorlds: "Back to worlds",
    storyPickerHeading: "Stories to read",
    storyPickerEmpty: "No stories here yet. Let's check another world!",
    chapterPickerBackToStories: "Back to stories",
    chapterPickerHeading: "Chapters",
    chapterPickerEmpty: "No chapters written yet.",
    chapterPickerFinished: "Finished",
    notFoundTitle: "Page not found",
    notFoundBody: "We couldn't find that page. Let's head back to the start.",
    grownupsBackToApp: "Back to app",
    profileManagerHeading: "Readers",
    profileManagerSubtitle: "Add, rename, or remove a kid profile on this device.",
    profileManagerAddReader: "Add reader",
  },
} as const;

export type CopyKey = keyof (typeof dict)["en-GB"];

export function getCopy(variant: LanguageVariant): Record<CopyKey, string> {
  return dict[variant];
}

/**
 * Hook providing British/American English copy based on the active profile's
 * languageVariant preference. Defaults to British English (en-GB) when the
 * preference is missing or still loading so the UI never shows raw keys.
 */
export function useCopy(): {
  variant: LanguageVariant;
  t: (k: CopyKey) => string;
} {
  const id = getActiveProfileId();
  // Side-effect-free fallback: when no active profile is selected (e.g. the
  // grown-ups passcode screen, the profile picker before pick, or any page
  // mounted before a profile is set on the device), do NOT hit
  // /api/preferences. The server's resolveProfile() would otherwise fall
  // back to getOrCreateActiveProfile() and silently create a child profile
  // as a side effect. Default locally to en-GB instead.
  const { data } = useQuery({
    queryKey: ["preferences", id],
    queryFn: () => fetchPreferences(id),
    enabled: id != null,
    staleTime: 60_000,
  });
  const variant: LanguageVariant = data?.languageVariant ?? "en-GB";
  const table = dict[variant];
  return { variant, t: (k) => table[k] };
}
