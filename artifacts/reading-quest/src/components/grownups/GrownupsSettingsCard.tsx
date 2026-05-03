import { useEffect, useState } from "react";
import { Settings, Mail } from "lucide-react";
import { getActiveProfileId } from "@/lib/profile";

interface ServerPrefs {
  voiceSpeed: number;
  sessionLengthSuggestionMin: number;
  breakReminders: boolean;
  weeklyEmailOptIn: boolean;
  weeklyEmailAddress: string | null;
}

function authHeaders(token: string): Record<string, string> {
  const h: Record<string, string> = {
    "content-type": "application/json",
    "x-grownup-token": token,
  };
  const id = getActiveProfileId();
  if (id !== null) h["x-profile-id"] = String(id);
  return h;
}

export default function GrownupsSettingsCard({ token }: { token: string }) {
  const [prefs, setPrefs] = useState<ServerPrefs | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/preferences", { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((p: ServerPrefs) => setPrefs(p))
      .catch((e: Error) => setError(e.message));
  }, [token]);

  async function save(patch: Partial<ServerPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`save ${res.status}`);
      const fresh = (await res.json()) as ServerPrefs;
      setPrefs(fresh);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="grownups-settings">
        <p role="alert" className="text-sm text-red-600">
          Could not load settings: {error}
        </p>
      </div>
    );
  }
  if (!prefs) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="grownups-settings">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="grownups-settings">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900">Grown-ups settings</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">These apply to the active reader.</p>

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            Suggested session length: {prefs.sessionLengthSuggestionMin} min
          </span>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={prefs.sessionLengthSuggestionMin}
            onChange={(e) => void save({ sessionLengthSuggestionMin: Number(e.target.value) })}
            data-testid="settings-session-length"
            className="w-full mt-1"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700">
            Word-help voice speed: {prefs.voiceSpeed.toFixed(1)}×
          </span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={prefs.voiceSpeed}
            onChange={(e) => void save({ voiceSpeed: Number(e.target.value) })}
            data-testid="settings-voice-speed"
            className="w-full mt-1"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Gentle break reminders</span>
          <input
            type="checkbox"
            checked={prefs.breakReminders}
            onChange={(e) => void save({ breakReminders: e.target.checked })}
            data-testid="settings-break-reminders"
            className="w-4 h-4"
          />
        </label>

        <div className="border-t border-slate-100 pt-4">
          <label className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Weekly email summary
            </span>
            <input
              type="checkbox"
              checked={prefs.weeklyEmailOptIn}
              onChange={(e) => void save({ weeklyEmailOptIn: e.target.checked })}
              data-testid="settings-weekly-email"
              className="w-4 h-4"
            />
          </label>
          {prefs.weeklyEmailOptIn && (
            <>
              <label htmlFor="weekly-email-address" className="sr-only">
                Email address for the weekly summary
              </label>
              <input
                id="weekly-email-address"
                type="email"
                defaultValue={prefs.weeklyEmailAddress ?? ""}
                placeholder="grownup@example.com"
                data-testid="settings-weekly-email-address"
                aria-label="Email address for the weekly summary"
                onBlur={(e) => void save({ weeklyEmailAddress: e.target.value })}
                className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </>
          )}
        </div>

        {saved && <p className="text-[11px] text-emerald-600">Saved.</p>}
      </div>
    </div>
  );
}
