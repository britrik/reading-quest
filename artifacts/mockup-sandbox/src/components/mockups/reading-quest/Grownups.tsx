import React from "react";
import {
  BookOpen,
  Clock,
  Sparkles,
  TrendingUp,
  MessageSquareHeart,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Info,
  Lock,
} from "lucide-react";
import "./_group.css";

const minutesByDay = [
  { day: "Mon", mins: 12 },
  { day: "Tue", mins: 18 },
  { day: "Wed", mins: 0 },
  { day: "Thu", mins: 22 },
  { day: "Fri", mins: 15 },
  { day: "Sat", mins: 27 },
  { day: "Sun", mins: 19 },
];

const wordsHelpedOn = [
  { word: "whispering", times: 3, status: "learning" },
  { word: "clearing", times: 2, status: "learning" },
  { word: "stardust", times: 1, status: "got it" },
  { word: "ancient", times: 4, status: "learning" },
  { word: "geode", times: 2, status: "new" },
  { word: "temple", times: 1, status: "got it" },
];

const finishedStories = [
  {
    title: "The Lost Voxel-Bear",
    world: "Whispering Woods",
    finishedOn: "Apr 28",
    minutes: 24,
  },
  {
    title: "Cloud Ruins, Chapter 1",
    world: "Cloud Ruins",
    finishedOn: "Apr 24",
    minutes: 31,
  },
  {
    title: "First Steps in the Caverns",
    world: "Crystal Caverns",
    finishedOn: "Apr 19",
    minutes: 18,
  },
];

const sharedNotes = [
  {
    when: "Yesterday",
    text: "I liked the part where the fox waved its paw. It looked friendly.",
  },
  {
    when: "Apr 27",
    text: "The word 'whispering' was tricky but I figured it out by sounding it.",
  },
];

const maxMins = Math.max(...minutesByDay.map((d) => d.mins));
const totalMinsWeek = minutesByDay.reduce((s, d) => s + d.mins, 0);

function statusColor(status: string): string {
  if (status === "got it") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "new") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export function Grownups() {
  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 text-slate-800 font-atkinson">
      {/* Top frame: clearly "for grown-ups" */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
                Grown-ups view
              </div>
              <div className="text-base font-semibold text-slate-900">
                Reading Quest · Family dashboard
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" />
            <span>Alex never sees this screen</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Context strip */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              How Alex is reading
            </h1>
            <p className="text-sm text-slate-500">
              A quiet snapshot — no scores, no rankings. Just what's happening.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
              This week
            </button>
            <button className="px-3 py-1.5 rounded-md border border-transparent text-slate-500 hover:bg-white">
              Last 30 days
            </button>
            <button className="px-3 py-1.5 rounded-md border border-transparent text-slate-500 hover:bg-white">
              All time
            </button>
          </div>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Minutes read
              </span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 leading-none mb-1">
              {totalMinsWeek}
              <span className="text-base font-normal text-slate-400 ml-1">min</span>
            </div>
            <div className="text-xs text-slate-500">
              this week · across 6 days
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Stories finished
              </span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 leading-none mb-1">
              3
            </div>
            <div className="text-xs text-slate-500">+1 vs last week</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                New words met
              </span>
              <Sparkles className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 leading-none mb-1">
              17
            </div>
            <div className="text-xs text-slate-500">
              4 worked through repeatedly
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Self-paced sessions
              </span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-semibold text-slate-900 leading-none mb-1">
              9
            </div>
            <div className="text-xs text-slate-500">
              avg 13 min · longest 27 min
            </div>
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Reading minutes chart */}
          <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-0.5">
                  Reading minutes
                </h2>
                <p className="text-xs text-slate-500">
                  Time actually spent in a story (idle time excluded).
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                Apr 26 – May 2
              </div>
            </div>

            <div className="flex items-stretch gap-3 h-44 px-2">
              {minutesByDay.map((d) => {
                const h = Math.round((d.mins / maxMins) * 100);
                return (
                  <div
                    key={d.day}
                    className="flex-1 h-full flex flex-col items-center"
                  >
                    <div className="text-[11px] font-medium text-slate-500 mb-1">
                      {d.mins}
                    </div>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-sm bg-slate-900/85"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      {d.day}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5" />
              Rest days are not flagged as "missed." Reading should feel optional.
            </div>
          </div>

          {/* Words helped on */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-0.5">
                Words Alex worked on
              </h2>
              <p className="text-xs text-slate-500">
                Tapped for help, or sounded out aloud.
              </p>
            </div>

            <ul className="space-y-2">
              {wordsHelpedOn.map((w) => (
                <li
                  key={w.word}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {w.word}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {w.times} {w.times === 1 ? "time" : "times"}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded border ${statusColor(w.status)}`}
                  >
                    {w.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stories + Notes */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-0.5">
                  Stories finished
                </h2>
                <p className="text-xs text-slate-500">
                  Reaching the end of a story is its own milestone.
                </p>
              </div>
              <button className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="font-semibold py-2">Story</th>
                  <th className="font-semibold py-2">World</th>
                  <th className="font-semibold py-2">Finished</th>
                  <th className="font-semibold py-2 text-right">Minutes</th>
                </tr>
              </thead>
              <tbody>
                {finishedStories.map((s) => (
                  <tr
                    key={s.title}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 font-medium text-slate-800">
                      {s.title}
                    </td>
                    <td className="py-3 text-slate-600">{s.world}</td>
                    <td className="py-3 text-slate-600">{s.finishedOn}</td>
                    <td className="py-3 text-right text-slate-600 tabular-nums">
                      {s.minutes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquareHeart className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Notes Alex shared
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Only what Alex chose to share. Private notes stay private.
            </p>

            <div className="space-y-3">
              {sharedNotes.map((n) => (
                <div
                  key={n.when}
                  className="rounded-md border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    {n.when}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    "{n.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer guardrails */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">
              A note on what's missing:
            </span>{" "}
            you won't see streaks, ranks, leaderboards, or "behind grade level"
            badges here. The kid app hides these on purpose, and so does this
            view, so the conversation at home stays about the story — not the
            score.
          </div>
        </div>
      </div>
    </div>
  );
}
