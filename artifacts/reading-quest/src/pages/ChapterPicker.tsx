import { Link, useParams } from "wouter";
import { BookOpen, ChevronRight, Check } from "lucide-react";
import { useGetStory } from "@workspace/api-client-react";
import { PageLoader, PageError } from "@/components/PageStates";

export default function ChapterPicker() {
  const params = useParams();
  const storyId = Number(params.storyId);
  
  const { data: story, isLoading, error } = useGetStory(storyId, { query: { enabled: !!storyId } });

  if (isLoading) return <PageLoader />;
  if (error || !story) return <PageError />;

  return (
    <div className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson text-[#2D3142] relative overflow-hidden flex flex-col">
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[#FF9B54] to-transparent opacity-20 pointer-events-none" />
      
      <header className="p-6 relative z-10">
        <Link href={`/world/${story.worldId}`} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow hover:-translate-y-1 transition-transform">
          <BookOpen className="w-5 h-5 text-[#2D3142]" />
          <span className="font-fredoka font-semibold">Back to stories</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-12 relative z-10">
        <div className="w-full max-w-2xl flex flex-col items-center text-center mb-10 bg-white/80 backdrop-blur-md p-8 rounded-3xl voxel-shadow">
          <h1 className="font-fredoka text-4xl font-bold mb-4">{story.title}</h1>
          <p className="text-xl text-gray-700 max-w-lg">{story.summary}</p>
        </div>

        <div className="w-full max-w-2xl flex flex-col gap-4">
          <h2 className="font-fredoka text-2xl font-bold text-[#FF9B54] ml-4">
            Chapters
          </h2>

          <div className="bg-white rounded-3xl p-4 voxel-shadow flex flex-col gap-2">
            {story.chapters.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No chapters written yet.</p>
            ) : (
              story.chapters.map((chapter, index) => (
                <Link 
                  key={chapter.id}
                  href={`/story/${story.id}/chapter/${chapter.id}`}
                  className={`w-full rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-[#FFE5B4]/30 ${
                    chapter.finished ? "bg-gray-50 opacity-80" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#FFE5B4] text-[#FF9B54] font-fredoka font-bold text-lg flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-fredoka text-xl ${chapter.finished ? "text-gray-500" : "text-[#2D3142]"}`}>
                      {chapter.title}
                    </h3>
                  </div>
                  <div className="shrink-0 flex items-center">
                    {chapter.finished ? (
                      <div className="flex items-center gap-2 bg-[#A5FFD6]/30 px-3 py-1 rounded-full text-teal-700 font-bold font-fredoka text-sm">
                        <Check className="w-4 h-4" /> Finished
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white voxel-shadow flex items-center justify-center text-[#FF9B54]">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
