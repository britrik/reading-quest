import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { getActiveProfileId } from "@/lib/profile";

export interface VocabRow {
  wordKey: string;
  word: string;
  helpCount: number;
  lastHelpAt: string;
  subsequentReads: number;
  status: "new" | "practicing" | "learned";
}

function authHeaders(token: string): Record<string, string> {
  const h: Record<string, string> = { "x-grownup-token": token };
  const id = getActiveProfileId();
  if (id !== null) h["x-profile-id"] = String(id);
  return h;
}

export default function VocabularyPanel({ token }: { token: string }) {
  const [rows, setRows] = useState<VocabRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/grownups/vocabulary", { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: VocabRow[]) => setRows(data))
      .catch((e: Error) => setError(e.message));
  }, [token]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="vocab-panel">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Vocabulary tracker</h2>
          </div>
          <p className="text-xs text-slate-500">
            Words tapped for help, and how often the kid finished a chapter afterwards (a gentle proxy for learning).
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && rows === null && <p className="text-sm text-slate-500">Loading…</p>}
      {!error && rows && rows.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">No words tapped yet.</p>
      )}
      {!error && rows && rows.length > 0 && (
        <ul className="divide-y divide-slate-100" data-testid="vocab-list">
          {rows.map((r) => (
            <li
              key={r.wordKey}
              data-testid={`vocab-row-${r.wordKey}`}
              data-status={r.status}
              className="flex items-center justify-between py-3"
            >
              <div>
                <div className="text-sm font-medium text-slate-800">{r.word}</div>
                <div className="text-[11px] text-slate-500">
                  Helped {r.helpCount}× · {r.subsequentReads} chapter{r.subsequentReads === 1 ? "" : "s"} finished after
                </div>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded border ${
                  r.status === "learned"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : r.status === "practicing"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
