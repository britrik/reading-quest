import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Lock, Sparkles } from "lucide-react";
import {
  AVATAR_EMOJI,
  listProfiles,
  type Avatar,
  type ProfileListItem,
} from "@/lib/profilesApi";
import { setActiveProfileId } from "@/lib/profile";
import { applyPreferencesToDocument, fetchPreferences } from "@/lib/preferences";

export default function ProfilePicker() {
  const [, setLocation] = useLocation();
  const [profiles, setProfiles] = useState<ProfileListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch((e: Error) => setError(e.message));
  }, []);

  async function pickProfile(p: ProfileListItem) {
    setActiveProfileId(p.id);
    try {
      const prefs = await fetchPreferences(p.id);
      applyPreferencesToDocument(prefs);
    } catch {
      /* defaults are already applied */
    }
    setLocation(p.onboarded ? "/" : "/onboarding");
  }

  return (
    <div
      className="min-h-[100dvh] w-full bg-[#FFE5B4] flex flex-col items-center justify-center p-6 font-atkinson"
      data-testid="profile-picker"
    >
      <div className="text-center mb-8">
        <Sparkles className="w-12 h-12 text-[#FF9B54] mx-auto mb-3" aria-hidden="true" />
        <h1 className="font-fredoka text-4xl font-bold text-[#2D3142] mb-2">Tap your picture</h1>
        <p className="text-lg text-gray-700">No reading needed — just pick your animal!</p>
      </div>

      {error && (
        <div role="alert" className="mb-4 text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl w-full">
        {profiles?.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => pickProfile(p)}
            data-testid={`profile-card-${p.id}`}
            className="bg-white rounded-3xl p-5 flex flex-col items-center voxel-shadow hover:-translate-y-1 transition-transform"
          >
            {/* Avatar-only picker: kids who can't read yet need to choose by
                picture. The profile name is exposed only to assistive tech via
                the accessible label so screen readers still announce it. */}
            <div className="text-7xl" aria-hidden="true">
              {AVATAR_EMOJI[(p.avatar as Avatar) ?? "fox"] ?? "🦊"}
            </div>
            <span className="sr-only">{p.name}</span>
          </button>
        ))}
      </div>

      <Link
        href="/grownups"
        data-testid="picker-add-via-grownups"
        className="mt-8 inline-flex items-center gap-2 text-sm text-gray-700 bg-white/70 px-4 py-2 rounded-full"
      >
        <Lock className="w-4 h-4" aria-hidden="true" />
        Grown-ups: add a new reader
      </Link>
    </div>
  );
}
