import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Plus, Sparkles } from "lucide-react";
import {
  AVATARS,
  AVATAR_EMOJI,
  createProfile,
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
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<Avatar>("fox");

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await createProfile({ name: name.trim(), avatar });
      setActiveProfileId(created.id);
      setLocation("/onboarding");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div
      className="min-h-[100dvh] w-full bg-[#FFE5B4] flex flex-col items-center justify-center p-6 font-atkinson"
      data-testid="profile-picker"
    >
      <div className="text-center mb-8">
        <Sparkles className="w-12 h-12 text-[#FF9B54] mx-auto mb-3" aria-hidden="true" />
        <h1 className="font-fredoka text-4xl font-bold text-[#2D3142] mb-2">Who's reading today?</h1>
        <p className="text-lg text-gray-700">Tap your picture to start</p>
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
            <div className="text-6xl mb-2" aria-hidden="true">
              {AVATAR_EMOJI[(p.avatar as Avatar) ?? "fox"] ?? "🦊"}
            </div>
            <div className="font-fredoka font-semibold text-xl text-[#2D3142]">{p.name}</div>
          </button>
        ))}

        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            data-testid="add-profile"
            className="bg-white/60 border-2 border-dashed border-[#FF9B54] rounded-3xl p-5 flex flex-col items-center justify-center text-[#FF9B54] hover:bg-white"
          >
            <Plus className="w-10 h-10 mb-2" />
            <span className="font-fredoka font-semibold">New reader</span>
          </button>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mt-8 bg-white p-6 rounded-3xl voxel-shadow w-full max-w-md"
          data-testid="create-profile-form"
        >
          <h2 className="font-fredoka text-2xl font-bold mb-4">Add a new reader</h2>
          <label className="block mb-3">
            <span className="text-sm font-semibold text-gray-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="new-profile-name"
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9B54]"
              placeholder="What should we call you?"
              autoFocus
              maxLength={40}
            />
          </label>
          <fieldset className="mb-4">
            <legend className="text-sm font-semibold text-gray-700 mb-2">Pick an avatar</legend>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  aria-pressed={avatar === a}
                  aria-label={a}
                  data-testid={`avatar-${a}`}
                  className={`text-3xl p-2 rounded-lg border-2 ${avatar === a ? "border-[#FF9B54] bg-[#FFE5B4]" : "border-transparent"}`}
                >
                  {AVATAR_EMOJI[a]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!name.trim()}
              data-testid="create-profile-submit"
              className="flex-1 bg-[#FF9B54] text-white py-3 rounded-lg font-fredoka font-semibold disabled:opacity-50"
            >
              Let's go!
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-3 rounded-lg border border-gray-300 font-fredoka"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
