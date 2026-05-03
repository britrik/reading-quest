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
  const { data } = useQuery({
    queryKey: ["preferences", id],
    queryFn: () => fetchPreferences(id),
    staleTime: 60_000,
  });
  const variant: LanguageVariant = data?.languageVariant ?? "en-GB";
  const table = dict[variant];
  return { variant, t: (k) => table[k] };
}
