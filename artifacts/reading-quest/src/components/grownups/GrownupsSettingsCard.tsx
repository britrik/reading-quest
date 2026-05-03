import { useEffect, useState } from "react";
import { Settings, Mail, Globe } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getActiveProfileId } from "@/lib/profile";
import { LANGUAGE_VARIANTS, type LanguageVariant } from "@/lib/preferences";

interface ServerPrefs {
  voiceSpeed: number;
  sessionLengthSuggestionMin: number;
  breakReminders: boolean;
  weeklyEmailOptIn: boolean;
  weeklyEmailAddress: string | null;
  languageVariant: LanguageVariant;
}

const LANGUAGE_LABELS: Record<LanguageVariant, string> = {
  "en-GB": "British English (cosy, colour, favourite)",
  "en-US": "American English (cozy, color, favorite)",
};

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
  const queryClient = useQueryClient();
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
      // Invalidate the kid-app preferences cache so useCopy() picks up the
      // new languageVariant immediately without a page reload.
      void queryClient.invalidateQueries({ queryKey: ["preferences"] });
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

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Language
          </span>
          <select
            value={prefs.languageVariant}
            onChange={(e) => void save({ languageVariant: e.target.value as LanguageVariant })}
            data-testid="settings-language-variant"
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
          >
            {LANGUAGE_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {LANGUAGE_LABELS[v]}
              </option>
            ))}
          </select>
          <span className="block mt-1 text-[11px] text-slate-500">
            Switches the wording and spelling shown to the active reader (e.g. "Cosy" vs "Cozy").
          </span>
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
              <SendWeeklyEmailButton token={token} />
            </>
          )}
        </div>

        {saved && <p className="text-[11px] text-emerald-600">Saved.</p>}
      </div>
    </div>
  );
}

function SendWeeklyEmailButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "fallback" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSend() {
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/grownups/weekly-summary/send", {
        method: "POST",
        headers: authHeaders(token),
      });
      if (res.ok) {
        setStatus("sent");
        setMessage("Sent — check your inbox.");
        return;
      }
      // Server tells us when email isn't configured; offer the printable
      // (browser print → save as PDF) fallback explicitly.
      const body = (await res.json().catch(() => ({}))) as { reason?: string; fallback?: string };
      if (res.status === 501 && body.reason === "email_not_configured") {
        setStatus("fallback");
        setMessage("Email not set up here — open the printable summary instead.");
        return;
      }
      setStatus("error");
      setMessage("Could not send right now.");
    } catch (e) {
      setStatus("error");
      setMessage((e as Error).message);
    }
  }

  function openPrintable() {
    // Opening with the token in a header isn't possible from window.open; the
    // server requires the token, so we issue a fetch and stream the HTML into
    // a new tab via a blob URL.
    fetch("/api/grownups/weekly-summary/printable", { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((html) => {
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      })
      .catch((e: Error) => setMessage(e.message));
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void handleSend()}
        disabled={status === "sending"}
        data-testid="send-weekly-email"
        className="self-start text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send weekly summary now"}
      </button>
      {status === "fallback" && (
        <button
          type="button"
          onClick={openPrintable}
          data-testid="open-printable-summary"
          className="self-start text-xs font-semibold underline text-slate-700"
        >
          Open printable summary (Print → Save as PDF)
        </button>
      )}
      {message && (
        <p className="text-[11px] text-slate-600" data-testid="weekly-email-status" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
