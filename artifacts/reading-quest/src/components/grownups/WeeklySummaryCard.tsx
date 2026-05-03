import { useEffect, useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import { getActiveProfileId } from "@/lib/profile";

interface Summary {
  minutesRead: number;
  daysActive: number;
  chaptersFinished: number;
  wordsTapped: number;
  highlights: string[];
}

function authHeaders(token: string): Record<string, string> {
  const h: Record<string, string> = { "x-grownup-token": token };
  const id = getActiveProfileId();
  if (id !== null) h["x-profile-id"] = String(id);
  return h;
}

export default function WeeklySummaryCard({ token }: { token: string }) {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/grownups/weekly-summary", { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, [token]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="weekly-summary">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquareHeart className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900">What to celebrate this week</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Plain-language highlights. No streaks. No rankings.
      </p>
      {!data && <p className="text-sm text-slate-500">Loading…</p>}
      {data && (
        <ul className="space-y-2" data-testid="weekly-highlights">
          {data.highlights.map((h, i) => (
            <li key={i} className="text-sm text-slate-700 leading-relaxed">
              · {h}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
