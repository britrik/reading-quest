import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Type, Eye, Wind, Volume2, ArrowLeft, User, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  applyPreferencesToDocument,
  fetchPreferences,
  savePreferences,
  type Preferences,
  type FontSize,
  type Soundscape,
} from "@/lib/preferences";
import { getActiveProfileId } from "@/lib/profile";
import { updateProfile } from "@/lib/profilesApi";
import { useCopy } from "@/lib/copy";
import { PageLoader } from "@/components/PageStates";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

const FONT_LABELS: Record<FontSize, string> = { small: "A", medium: "A", large: "A" };
const SOUND_LABELS: Record<Soundscape, string> = {
  none: "Quiet",
  forest: "Forest",
  rain: "Rain",
  ocean: "Ocean",
};

export default function Settings() {
  const copy = useCopy();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: me } = useGetMe();
  const [nameValue, setNameValue] = useState("");
  const [nameEditing, setNameEditing] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (me?.name && !nameEditing) setNameValue(me.name);
  }, [me?.name, nameEditing]);

  useEffect(() => {
    fetchPreferences(getActiveProfileId())
      .then((p) => {
        setPrefs(p);
        applyPreferencesToDocument(p);
      })
      .catch(() => {
        /* fall back to PageLoader */
      });
  }, []);

  async function update(patch: Partial<Preferences>) {
    if (!prefs) return;
    const optimistic = { ...prefs, ...patch };
    setPrefs(optimistic);
    applyPreferencesToDocument(optimistic);
    setSaving(true);
    try {
      const saved = await savePreferences(getActiveProfileId(), patch);
      setPrefs(saved);
      applyPreferencesToDocument(saved);
      setSavedAt(Date.now());
      await queryClient.invalidateQueries({ queryKey: ["preferences"] });
    } finally {
      setSaving(false);
    }
  }

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === me?.name) { setNameEditing(false); return; }
    const id = getActiveProfileId();
    if (id === null) return;
    setNameSaving(true);
    try {
      await updateProfile(id, { name: trimmed });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setNameSaved(true);
      setNameEditing(false);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setNameSaving(false);
    }
  }

  if (!prefs) return <PageLoader />;

  return (
    <div
      className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson p-4 md:p-8"
      data-testid="settings-page"
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#2D3142] mb-6 font-fredoka"
          data-testid="settings-back"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>

        <h1 className="font-fredoka text-4xl font-bold mb-2">{copy.t("settingsTitle")}</h1>
        <p className="text-gray-700 mb-6">Make Reading Quest feel just right.</p>

        <section className="bg-white rounded-3xl p-6 voxel-shadow mb-6" data-testid="name-section">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#FF9B54]" />
            <h2 className="font-fredoka text-xl font-bold">Your name</h2>
          </div>
          {nameEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void saveName(); if (e.key === "Escape") setNameEditing(false); }}
                maxLength={40}
                autoFocus
                data-testid="settings-name-input"
                className="flex-1 bg-[#FFE5B4] rounded-xl px-4 py-2 font-fredoka text-lg border-2 border-[#FF9B54] outline-none"
              />
              <button
                type="button"
                onClick={() => void saveName()}
                disabled={nameSaving || !nameValue.trim()}
                data-testid="settings-name-save"
                className="bg-[#FF9B54] text-white px-4 py-2 rounded-xl font-fredoka font-semibold disabled:opacity-50 inline-flex items-center gap-1"
              >
                {nameSaving ? "Saving…" : <><Check className="w-4 h-4" /> Save</>}
              </button>
              <button
                type="button"
                onClick={() => { setNameEditing(false); setNameValue(me?.name ?? ""); }}
                className="text-gray-500 px-3 py-2 font-fredoka"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-fredoka text-2xl text-[#2D3142]" data-testid="settings-name-display">
                {nameValue || me?.name}
                {nameSaved && <span className="text-base text-[#FF9B54] ml-2">Saved ✨</span>}
              </span>
              <button
                type="button"
                onClick={() => setNameEditing(true)}
                data-testid="settings-name-edit"
                className="text-sm font-semibold text-[#FF9B54] px-3 py-1.5 rounded-xl border-2 border-[#FF9B54]/30 hover:border-[#FF9B54]"
              >
                Change
              </button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl p-6 voxel-shadow mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-[#FF9B54]" />
            <h2 className="font-fredoka text-xl font-bold">Words on the page</h2>
          </div>

          <div className="mb-5">
            <div className="text-sm font-semibold text-gray-700 mb-2">Word size</div>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Font size">
              {(["small", "medium", "large"] as FontSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={prefs.fontSize === size}
                  data-testid={`font-${size}`}
                  onClick={() => update({ fontSize: size })}
                  className={`py-3 rounded-lg border-2 ${prefs.fontSize === size ? "border-[#FF9B54] bg-[#FFE5B4]" : "border-gray-200"}`}
                >
                  <span style={{ fontSize: size === "small" ? 14 : size === "medium" ? 18 : 24 }}>
                    {FONT_LABELS[size]}
                  </span>
                  <div className="text-xs text-gray-600 mt-1 capitalize">{size}</div>
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            icon={<Eye className="w-5 h-5 text-[#FF9B54]" />}
            label="High contrast"
            description="Bigger differences between text and background."
            checked={prefs.highContrast}
            onChange={(v) => update({ highContrast: v })}
            testId="toggle-high-contrast"
          />
          <ToggleRow
            icon={<Wind className="w-5 h-5 text-[#FF9B54]" />}
            label="Reduced motion"
            description="Gentler animations."
            checked={prefs.reducedMotion}
            onChange={(v) => update({ reducedMotion: v })}
            testId="toggle-reduced-motion"
          />
        </section>

        <section className="bg-white rounded-3xl p-6 voxel-shadow mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-[#FF9B54]" />
            <h2 className="font-fredoka text-xl font-bold">Sounds</h2>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="voice-speed">
              Read-aloud speed
            </label>
            <input
              id="voice-speed"
              type="range"
              min={0.5}
              max={1.5}
              step={0.1}
              value={prefs.voiceSpeed}
              onChange={(e) => update({ voiceSpeed: Number.parseFloat(e.target.value) })}
              data-testid="voice-speed"
              className="w-full"
            />
            <div className="text-xs text-gray-600">{prefs.voiceSpeed.toFixed(1)}× speed</div>
          </div>

          <div className="mb-5">
            <div className="text-sm font-semibold text-gray-700 mb-2">Background sound</div>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Background sound">
              {(Object.keys(SOUND_LABELS) as Soundscape[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={prefs.soundscape === s}
                  data-testid={`soundscape-${s}`}
                  onClick={() => update({ soundscape: s })}
                  className={`py-2 rounded-lg border-2 text-sm font-fredoka ${prefs.soundscape === s ? "border-[#FF9B54] bg-[#FFE5B4]" : "border-gray-200"}`}
                >
                  {SOUND_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            icon={<Volume2 className="w-5 h-5 text-[#FF9B54]" />}
            label="Sound effects"
            description="Tiny chimes when you earn a gem or finish a chapter."
            checked={prefs.soundEnabled}
            onChange={(v) => update({ soundEnabled: v })}
            testId="toggle-sound"
          />
        </section>

        <div className="text-sm text-gray-600 text-center" aria-live="polite" data-testid="settings-status">
          {saving ? "Saving…" : savedAt ? "Saved ✨" : "Changes save automatically"}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-t border-gray-100 first:border-t-0">
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-0.5">{icon}</div>
        <div>
          <div className="font-semibold text-[#2D3142]">{label}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-testid={testId}
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-14 h-8 rounded-full transition-colors relative ${checked ? "bg-[#FF9B54]" : "bg-gray-300"}`}
      >
        <span
          className={`block w-6 h-6 bg-white rounded-full shadow absolute top-1 transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
