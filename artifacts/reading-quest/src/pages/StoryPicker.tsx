import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import { Map, ChevronRight, BookOpen, Lock, Gem } from "lucide-react";
import { useListWorlds, useListStoriesInWorld, getListStoriesInWorldQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLoader, PageError } from "@/components/PageStates";
import { getImageUrl } from "@/lib/utils";
import { getActiveProfileId } from "@/lib/profile";
import { fetchPreferences } from "@/lib/preferences";
import { playUnlock } from "@/lib/sound";
import { toast } from "sonner";

interface UnlockResponse { ok: boolean; alreadyUnlocked: boolean; gemsRemaining: number }
interface UnlockError { error: string; gemsRemaining?: number; gemUnlockCost?: number }

export default function StoryPicker() {
  const params = useParams();
  const worldId = Number(params.worldId);
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [unlockingId, setUnlockingId] = useState<number | null>(null);

  const { data: worlds, isLoading: worldsLoading, error: worldsError } = useListWorlds();
  const { data: stories, isLoading: storiesLoading, error: storiesError } = useListStoriesInWorld(worldId, {
    query: { enabled: !!worldId, queryKey: ["stories-in-world", worldId] as const },
  });

  if (worldsLoading || storiesLoading) return <PageLoader />;
  if (worldsError || storiesError || !worlds || !stories) return <PageError />;

  const world = worlds.find((w) => w.id === worldId);
  if (!world) return <PageError text="I couldn't find this world. Let's go back and try another one!" />;

  async function handleUnlock(storyId: number) {
    setUnlockingId(storyId);
    try {
      const profileId = getActiveProfileId();
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (profileId !== null) headers["x-profile-id"] = String(profileId);
      const res = await fetch(`/api/stories/${storyId}/unlock`, { method: "POST", headers });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as UnlockError;
        toast.error(err.error === "Not enough gems" ? "Not enough gems yet — finish more chapters!" : (err.error ?? "Could not unlock"));
        return;
      }
      const body = (await res.json()) as UnlockResponse;
      const prefs = await fetchPreferences(profileId).catch(() => null);
      playUnlock(prefs?.soundEnabled ?? true);
      toast.success(body.alreadyUnlocked ? "Already unlocked!" : "Unlocked! Happy reading.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListStoriesInWorldQueryKey(worldId) }),
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() }),
      ]);
      setLocation(`/story/${storyId}`);
    } finally {
      setUnlockingId(null);
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson text-[#2D3142] relative overflow-hidden flex flex-col">
      <div
        className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] opacity-30 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${world.chipColor}, transparent)` }}
      />

      <header className="p-6 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow hover:-translate-y-1 transition-transform">
          <Map className="w-5 h-5 text-[#2D3142]" />
          <span className="font-fredoka font-semibold">Back to worlds</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-12 relative z-10">
        <div className="w-full max-w-2xl flex flex-col items-center text-center mb-10">
          <div className="w-40 h-40 rounded-3xl overflow-hidden voxel-panel mb-6" style={{ borderColor: world.chipColor }}>
            <img src={getImageUrl(world.thumbnailUrl)} alt={world.name} className="w-full h-full object-cover" />
          </div>
          <h1 className="font-fredoka text-4xl font-bold mb-3">{world.name}</h1>
          <p className="text-xl text-gray-700 max-w-lg">{world.blurb}</p>
        </div>

        <div className="w-full max-w-2xl flex flex-col gap-4">
          <h2 className="font-fredoka text-2xl font-bold text-[#FF9B54] ml-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Stories to read
          </h2>

          {stories.length === 0 ? (
            <div className="bg-white/80 rounded-3xl p-8 text-center voxel-shadow">
              <p className="text-xl text-gray-600">No stories here yet. Let's check another world!</p>
            </div>
          ) : (
            stories.map((story) => {
              const unlocked = story.unlocked ?? true;
              if (unlocked) {
                return (
                  <Link
                    key={story.id}
                    href={`/story/${story.id}`}
                    className="w-full bg-white rounded-3xl p-5 flex items-center justify-between gap-6 voxel-shadow hover:-translate-y-1 transition-transform text-left group"
                    data-testid={`story-row-${story.id}`}
                  >
                    <div className="flex-1 py-2">
                      <h3 className="font-fredoka text-2xl font-bold text-[#2D3142] mb-2">{story.title}</h3>
                      <p className="text-lg text-gray-600 leading-relaxed mb-4">{story.summary}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden max-w-xs voxel-shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-[#A5FFD6] to-[#84DCC6] rounded-full"
                            style={{ width: `${Math.max(5, (story.finishedChapterCount / story.chapterCount) * 100)}%` }}
                          />
                        </div>
                        <span className="font-fredoka text-sm font-bold text-gray-500">
                          {story.finishedChapterCount}/{story.chapterCount}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#FFE5B4] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <ChevronRight className="w-6 h-6 text-[#FF9B54]" />
                    </div>
                  </Link>
                );
              }
              const cost = story.gemUnlockCost ?? 0;
              return (
                <div
                  key={story.id}
                  className="w-full bg-white/70 rounded-3xl p-5 flex items-center justify-between gap-6 voxel-shadow text-left"
                  data-testid={`story-row-${story.id}`}
                >
                  <div className="flex-1 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-5 h-5 text-gray-500" aria-hidden="true" />
                      <h3 className="font-fredoka text-2xl font-bold text-[#2D3142]">{story.title}</h3>
                    </div>
                    <p className="text-lg text-gray-600 leading-relaxed">{story.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleUnlock(story.id)}
                    disabled={unlockingId === story.id}
                    data-testid={`story-unlock-${story.id}`}
                    aria-label={`Unlock ${story.title} for ${cost} gems`}
                    className="shrink-0 bg-[#FF9B54] text-white rounded-full px-5 py-3 voxel-shadow font-fredoka inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    <Gem className="w-4 h-4" />
                    Unlock for {cost}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
