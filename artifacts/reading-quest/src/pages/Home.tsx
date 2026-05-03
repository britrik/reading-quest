import { Link, useLocation } from "wouter";
import { Star, Gem, Map, Heart, Play, Settings as SettingsIcon, Users } from "lucide-react";
import { useGetMe, useListWorlds, useGetActiveSession } from "@workspace/api-client-react";
import { PageLoader, PageError } from "@/components/PageStates";
import { getImageUrl } from "@/lib/utils";
import { useCopy } from "@/lib/copy";

export default function Home() {
  const copy = useCopy();
  const [, setLocation] = useLocation();
  const { data: me, isLoading: meLoading, error: meError } = useGetMe();
  const { data: worlds, isLoading: worldsLoading, error: worldsError } = useListWorlds();
  const { data: activeSession, isLoading: sessionLoading } = useGetActiveSession();

  if (meLoading || worldsLoading || sessionLoading) return <PageLoader />;
  if (meError || worldsError || !me || !worlds) return <PageError />;

  return (
    <div className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson text-[#2D3142] relative overflow-hidden flex flex-col">
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[#84DCC6] to-transparent opacity-40 pointer-events-none" />
      
      <header className="p-6 flex justify-between items-center relative z-10">
        <Link href="/pet" className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow hover:-translate-y-1 transition-transform">
          <Heart className="w-6 h-6 text-[#FF9B54] fill-[#FF9B54] animate-pulse-soft" />
          <div className="flex flex-col text-left">
            <span className="font-fredoka font-semibold text-xl text-[#FF9B54] leading-tight">Pet Level {me.petLevel}</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-2 bg-white/80 rounded-full overflow-hidden voxel-shadow-inner">
                <div className="h-full bg-gradient-to-r from-[#FF9B54] to-[#FFD166] rounded-full" style={{ width: `${me.petXpProgressPercent}%` }} />
              </div>
              <span className="font-fredoka text-xs text-[#FF9B54]/80">almost level {me.petLevel + 1}!</span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
            <Gem className="w-6 h-6 text-[#A5FFD6] fill-[#A5FFD6]" />
            <span className="font-fredoka font-semibold text-xl">{me.gems}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className="font-fredoka font-semibold text-xl">{me.stars}</span>
          </div>
          <Link
            href="/settings"
            data-testid="open-settings"
            aria-label={copy.t("settingsOpenAria")}
            className="flex items-center justify-center w-12 h-12 bg-white/60 backdrop-blur-sm rounded-full voxel-shadow hover:-translate-y-1 transition-transform"
          >
            <SettingsIcon className="w-6 h-6 text-[#2D3142]" />
          </Link>
          <Link
            href="/profiles"
            data-testid="switch-profile"
            aria-label="Switch reader"
            className="flex items-center justify-center w-12 h-12 bg-white/60 backdrop-blur-sm rounded-full voxel-shadow hover:-translate-y-1 transition-transform"
          >
            <Users className="w-6 h-6 text-[#2D3142]" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-12 relative z-10">
        {activeSession && (
          <div className="w-full max-w-2xl mb-8 animate-slide-up">
            <Link 
              href={`/story/${activeSession.storyId}/chapter/${activeSession.chapterId}`}
              className="w-full bg-[#A5FFD6] rounded-3xl p-6 flex items-center justify-between gap-6 voxel-shadow hover:-translate-y-1 transition-transform text-left group"
            >
              <div className="flex-1">
                <h3 className="font-fredoka text-2xl font-bold text-teal-900 mb-2">{copy.t("homeContinueHeading")}</h3>
                <p className="text-teal-800 text-lg">You left off in the middle of a story. Wanna jump back in?</p>
              </div>
              <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-teal-900 fill-teal-900 ml-1" />
              </div>
            </Link>
          </div>
        )}

        <div className="flex flex-col items-center mb-12 mt-4">
          <div className="w-48 h-48 relative animate-float mb-6">
            <img 
              src={getImageUrl("/images/reading-quest/companion.png")}
              alt="Friendly floating companion"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-[#A5FFD6] rounded-full blur-3xl opacity-30 -z-10" />
          </div>
          
          <div className="bg-white/80 backdrop-blur-md px-8 py-6 rounded-3xl voxel-shadow relative max-w-lg text-center">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-b-[20px] border-b-white/80 border-r-[16px] border-r-transparent" />
            <h1 className="font-fredoka text-3xl font-bold mb-2">Hey there, {me.name}! 👋</h1>
            <p className="text-xl leading-relaxed text-gray-700">
              The worlds are looking pretty cool today. Wanna explore one together?
            </p>
          </div>
        </div>

        <div className="w-full max-w-2xl flex flex-col gap-6">
          <h2 className="font-fredoka text-2xl font-bold text-[#FF9B54] ml-4 flex items-center gap-2">
            <Map className="w-6 h-6" />
            Pick your adventure
          </h2>

          {worlds.map((world) => (
            <Link 
              key={world.id}
              href={`/world/${world.id}`}
              className="w-full bg-white rounded-3xl p-4 flex items-center gap-6 voxel-shadow hover:-translate-y-1 transition-transform text-left group"
            >
              <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 voxel-panel" style={{ borderColor: world.chipColor }}>
                <img 
                  src={getImageUrl(world.thumbnailUrl)}
                  alt={world.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 py-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-fredoka text-2xl font-bold text-[#2D3142]">{world.name}</h3>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-5 h-5 ${star <= world.difficulty ? 'text-[#FF9B54] fill-[#FF9B54]' : 'text-gray-200 fill-gray-200'}`} 
                        style={{ color: star <= world.difficulty ? world.chipColor : undefined, fill: star <= world.difficulty ? world.chipColor : undefined }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed mb-4">
                  {world.blurb}
                </p>
                <span 
                  className="inline-block px-4 py-1.5 rounded-full font-bold font-fredoka text-sm"
                  style={{ backgroundColor: world.chipColor, color: world.chipTextColor }}
                >
                  {world.difficultyLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
