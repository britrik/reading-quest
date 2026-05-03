import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { BookOpen, Clock, Sparkles, TrendingUp, MessageSquareHeart, ShieldCheck, Calendar, ChevronRight, Info, Lock, Download } from "lucide-react";
import VocabularyPanel from "@/components/grownups/VocabularyPanel";
import WeeklySummaryCard from "@/components/grownups/WeeklySummaryCard";
import ProfileManager from "@/components/grownups/ProfileManager";
import GrownupsSettingsCard from "@/components/grownups/GrownupsSettingsCard";
import {
  useGrownupsAuth,
  useGrownupsSummary,
  useGrownupsWeeklyMinutes,
  useGrownupsWords,
  useGrownupsFinishedStories,
  useGrownupsRecentActivity
} from "@workspace/api-client-react";
import { PageLoader, PageError } from "@/components/PageStates";

function statusColor(helpCount: number): string {
  if (helpCount <= 1) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (helpCount >= 4) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function statusText(helpCount: number): string {
  if (helpCount <= 1) return "got it";
  if (helpCount >= 4) return "learning";
  return "practicing";
}

export default function Grownups() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('rq.grownupToken'));
  const [passcode, setPasscode] = useState("");
  const authMutation = useGrownupsAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate({ data: { passcode } }, {
      onSuccess: (res) => {
        localStorage.setItem('rq.grownupToken', res.token);
        setToken(res.token);
      },
      onError: () => {
        alert("Incorrect passcode");
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('rq.grownupToken');
    setToken(null);
  };

  if (!token) {
    return (
      <div className="min-h-[100dvh] w-full bg-slate-50 flex items-center justify-center font-atkinson p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-slate-900 mb-2">Grown-ups Area</h1>
          <p className="text-center text-slate-500 mb-6 text-sm">Please enter your passcode to view the family dashboard.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-center text-xl tracking-[0.2em]"
              autoFocus
            />
            <button 
              type="submit"
              disabled={authMutation.isPending || !passcode}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {authMutation.isPending ? "Unlocking..." : "Enter"}
            </button>
            <Link href="/" className="text-center text-sm text-slate-500 mt-2 hover:text-slate-900">Back to app</Link>
          </form>
        </div>
      </div>
    );
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
}

function DataExportCard({ token }: { token: string }) {
  async function handleExport() {
    const headers: Record<string, string> = { "x-grownup-token": token };
    const { getActiveProfileId } = await import("@/lib/profile");
    const id = getActiveProfileId();
    if (id !== null) headers["x-profile-id"] = String(id);
    const res = await fetch("/api/grownups/export", { headers });
    if (!res.ok) {
      alert("Could not export data.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cd = res.headers.get("content-disposition") ?? "";
    const m = /filename="([^"]+)"/.exec(cd);
    a.download = m?.[1] ?? "reading-quest-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="export-card">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900">Your data</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Reading Quest stores: profile name &amp; avatar, gem/star totals, pet stats, finished chapters,
        word-help events, reading sessions, and preferences. Nothing else. Tap below to download
        everything as JSON.
      </p>
      <button
        type="button"
        onClick={handleExport}
        data-testid="export-button"
        className="bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-md inline-flex items-center gap-2"
      >
        <Download className="w-4 h-4" /> Download all my data (JSON)
      </button>
    </div>
  );
}

function Dashboard({ token, onLogout }: { token: string, onLogout: () => void }) {
  const reqOpts = { headers: { 'x-grownup-token': token } };

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useGrownupsSummary({ request: reqOpts });
  const { data: weeklyMins, isLoading: minLoading } = useGrownupsWeeklyMinutes({ request: reqOpts });
  const { data: words, isLoading: wordsLoading } = useGrownupsWords({ request: reqOpts });
  const { data: stories, isLoading: storiesLoading } = useGrownupsFinishedStories({ request: reqOpts });
  
  // Automatically logout on 401
  useEffect(() => {
    if (summaryError?.status === 401) {
      onLogout();
    }
  }, [summaryError, onLogout]);

  if (summaryLoading || minLoading || wordsLoading || storiesLoading) return <PageLoader text="Loading dashboard..." />;
  if (summaryError || !summary || !weeklyMins || !words || !stories) return <PageError text="Could not load dashboard data." />;

  const maxMins = Math.max(...weeklyMins.map((d) => d.minutes), 1); // prevent div by zero
  const totalMinsWeek = weeklyMins.reduce((s, d) => s + d.minutes, 0);

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 text-slate-800 font-atkinson">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] md:text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
                Grown-ups view
              </div>
              <div className="text-sm md:text-base font-semibold text-slate-900">
                Reading Quest · Family dashboard
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5" />
              <span>Alex never sees this screen</span>
            </div>
            <button onClick={onLogout} className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200">Lock</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">How your reader is doing</h1>
            <p className="text-sm text-slate-500">A quiet snapshot — no scores, no rankings. Just what's happening.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Minutes read</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 leading-none mb-1">
              {summary.minutesRead}
              <span className="text-base font-normal text-slate-400 ml-1">min</span>
            </div>
            <div className="text-xs text-slate-500">all time</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Stories finished</span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 leading-none mb-1">{summary.storiesFinished}</div>
            <div className="text-xs text-slate-500">{summary.chaptersFinished} chapters total</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Words helped</span>
              <Sparkles className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 leading-none mb-1">{summary.wordsHelped}</div>
            <div className="text-xs text-slate-500">unique words tapped</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Sessions</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 leading-none mb-1">{summary.sessionsCount}</div>
            <div className="text-xs text-slate-500">reading sessions started</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-0.5">Reading minutes (Last 7 Days)</h2>
                <p className="text-xs text-slate-500">Time actually spent in a story (idle time excluded).</p>
              </div>
            </div>

            <div className="flex items-stretch gap-2 h-44 px-2">
              {weeklyMins.map((d) => {
                const finalH = d.minutes === 0 ? 0 : Math.max(5, Math.round((d.minutes / maxMins) * 100));
                const dObj = new Date(d.date);
                const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={d.date} className="flex-1 h-full flex flex-col items-center">
                    <div className="text-[11px] font-medium text-slate-500 mb-1">{d.minutes}</div>
                    <div className="w-full flex-1 flex items-end">
                      <div className="w-full rounded-sm bg-slate-900/85 transition-all" style={{ height: `${finalH}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2">{dayName}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5" />
              Rest days are not flagged as "missed." Reading should feel optional.
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-0.5">Words worked on</h2>
              <p className="text-xs text-slate-500">Tapped for help, or sounded out aloud.</p>
            </div>
            
            {words.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No words tapped yet.</p>
            ) : (
              <ul className="space-y-2 max-h-52 overflow-y-auto pr-2">
                {words.map((w) => (
                  <li key={w.wordKey} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{w.word}</div>
                      <div className="text-[11px] text-slate-500">{w.helpCount} {w.helpCount === 1 ? "time" : "times"}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded border ${statusColor(w.helpCount)}`}>
                      {statusText(w.helpCount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-0.5">Stories finished</h2>
                <p className="text-xs text-slate-500">Reaching the end of a story is its own milestone.</p>
              </div>
            </div>

            {stories.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No stories finished yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <th className="font-semibold py-2">Story</th>
                      <th className="font-semibold py-2">World</th>
                      <th className="font-semibold py-2">Finished</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stories.map((s) => {
                      const d = new Date(s.finishedAt);
                      return (
                        <tr key={s.storyId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="py-3 font-medium text-slate-800 pr-4">{s.title}</td>
                          <td className="py-3 text-slate-600 pr-4">{s.worldName}</td>
                          <td className="py-3 text-slate-600">{d.toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <WeeklySummaryCard token={token} />
          <VocabularyPanel token={token} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <GrownupsSettingsCard token={token} />
          <ProfileManager token={token} />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <DataExportCard token={token} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">A note on what's missing:</span>{" "}
            you won't see streaks, ranks, leaderboards, or "behind grade level"
            badges here. The kid app hides these on purpose, and so does this
            view, so the conversation at home stays about the story — not the score.
          </div>
        </div>
      </div>
    </div>
  );
}
