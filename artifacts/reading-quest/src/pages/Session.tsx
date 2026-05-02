import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Coffee, HelpCircle, ChevronRight, Gem, Footprints, Volume2, Heart, X, Sparkles } from "lucide-react";
import { 
  useGetChapter, 
  useStartSession, 
  useHeartbeatSession, 
  usePauseSession, 
  useFinishSession, 
  useLogWordHelp,
  getGetMeQueryKey,
  useGetActiveSession,
  getGetActiveSessionQueryKey,
  getGetStoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLoader, PageError } from "@/components/PageStates";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { TappableWord } from "@workspace/api-client-react";

function speak(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate;
      utter.pitch = 1.1;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    } catch {
      resolve();
    }
  });
}

async function speakWordHelp(entry: TappableWord): Promise<void> {
  for (const syl of entry.syllables) {
    await speak(syl, 0.7);
    await new Promise((r) => setTimeout(r, 180));
  }
  await new Promise((r) => setTimeout(r, 200));
  await speak(entry.word, 0.9);
}

export default function Session() {
  const params = useParams();
  const chapterId = Number(params.chapterId);
  const storyId = Number(params.storyId);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [helpMode, setHelpMode] = useState(false);
  const [pickedWordKey, setPickedWordKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { data: chapter, isLoading: chapterLoading, error: chapterError } = useGetChapter(chapterId, { query: { enabled: !!chapterId, queryKey: ["chapter", chapterId] as const } });
  const { data: activeSessionData, isLoading: activeSessionLoading } = useGetActiveSession();
  
  const startSession = useStartSession();
  const heartbeatSession = useHeartbeatSession();
  const pauseSession = usePauseSession();
  const finishSession = useFinishSession();
  const logWordHelp = useLogWordHelp();

  const activeSessionIdRef = useRef<number | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const initializedForChapterRef = useRef<number | null>(null);

  // Reset when route changes to a new chapter
  useEffect(() => {
    if (initializedForChapterRef.current !== chapterId) {
      activeSessionIdRef.current = null;
      initializedForChapterRef.current = null;
      lastHeartbeatRef.current = Date.now();
    }
  }, [chapterId]);

  // Setup session for the current chapter
  useEffect(() => {
    if (!chapter || activeSessionLoading) return;
    if (initializedForChapterRef.current === chapterId) return;

    if (activeSessionData && activeSessionData.chapterId === chapterId) {
      activeSessionIdRef.current = activeSessionData.id;
      lastHeartbeatRef.current = Date.now();
      initializedForChapterRef.current = chapterId;
      return;
    }

    // Either no active session, or it's for a different chapter — start (or reuse) one for this chapter.
    // POST /sessions on the server pauses any other active session and reuses an existing paused/active session for this chapter.
    startSession.mutate(
      { data: { chapterId } },
      {
        onSuccess: (session) => {
          activeSessionIdRef.current = session.id;
          lastHeartbeatRef.current = Date.now();
          initializedForChapterRef.current = chapterId;
          queryClient.invalidateQueries({ queryKey: getGetActiveSessionQueryKey() });
        },
      },
    );
  }, [chapter, activeSessionData, activeSessionLoading, chapterId, startSession, queryClient]);

  // Heartbeat interval
  useEffect(() => {
    const interval = setInterval(() => {
      const sid = activeSessionIdRef.current;
      if (!sid || document.hidden) return;
      
      const now = Date.now();
      const delta = now - lastHeartbeatRef.current;
      lastHeartbeatRef.current = now;
      
      heartbeatSession.mutate({ sessionId: sid, data: { activeMsDelta: delta } });
    }, 10000);
    
    return () => clearInterval(interval);
  }, [heartbeatSession]);

  if (chapterLoading || activeSessionLoading) return <PageLoader text="Walking to the chapter..." />;
  if (chapterError || !chapter) return <PageError />;

  const wordsMap = new Map<string, TappableWord>();
  chapter.tappableWords.forEach(tw => wordsMap.set(tw.key, tw));

  const pickedWord = pickedWordKey ? wordsMap.get(pickedWordKey) : null;

  const handlePickWord = (key: string) => {
    setPickedWordKey(key);
    const entry = wordsMap.get(key);
    if (!entry) return;
    
    const sid = activeSessionIdRef.current;
    if (sid) {
      logWordHelp.mutate({ sessionId: sid, data: { wordKey: key } });
    }
    
    setIsPlaying(true);
    speakWordHelp(entry).finally(() => setIsPlaying(false));
  };

  const handleHearIt = () => {
    if (!pickedWord) return;
    setIsPlaying(true);
    speakWordHelp(pickedWord).finally(() => setIsPlaying(false));
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setPickedWordKey(null);
  };

  const handleRest = () => {
    const sid = activeSessionIdRef.current;
    if (sid) {
      pauseSession.mutate({ sessionId: sid }, {
        onSettled: () => {
          setLocation("/");
        }
      });
    } else {
      setLocation("/");
    }
  };

  const handleNext = () => {
    const sid = activeSessionIdRef.current;
    if (sid) {
      finishSession.mutate({ sessionId: sid }, {
        onSuccess: (rewards) => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetActiveSessionQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStoryQueryKey(storyId) });
          activeSessionIdRef.current = null;
          initializedForChapterRef.current = null;

          toast.success("Chapter finished! 🎉", {
            description: `You earned ${rewards.gemsAwarded} gems and ${rewards.starsAwarded} stars!`,
            icon: <Sparkles className="w-5 h-5 text-yellow-400" />
          });
          
          if (chapter.nextChapterId) {
            setLocation(`/story/${storyId}/chapter/${chapter.nextChapterId}`);
          } else {
            setLocation(`/story/${storyId}`);
          }
        },
        onError: () => {
          toast.error("Oops! Couldn't finish the chapter.");
        }
      });
    } else {
      if (chapter.nextChapterId) {
        setLocation(`/story/${storyId}/chapter/${chapter.nextChapterId}`);
      } else {
        setLocation(`/story/${storyId}`);
      }
    }
  };

  const renderTappableParagraph = (text: string) => {
    const tokens = text.split(/(\s+)/);
    return tokens.map((tok, i) => {
      if (/^\s+$/.test(tok)) return <React.Fragment key={i}>{tok}</React.Fragment>;
      const cleanKey = tok.toLowerCase().replace(/[^a-z]/g, "");
      const entry = wordsMap.get(cleanKey);
      if (helpMode && entry) {
        return (
          <button
            key={i}
            onClick={() => handlePickWord(cleanKey)}
            className="rq-tappable-word"
            type="button"
          >
            {tok}
          </button>
        );
      }
      return <React.Fragment key={i}>{tok}</React.Fragment>;
    });
  };

  return (
    <div className="min-h-[100dvh] w-full relative font-atkinson text-[#2D3142] overflow-hidden flex flex-col justify-end pb-8 bg-[#2D3142]">
      <div className="absolute inset-0 -z-20">
        <img 
          src={getImageUrl(chapter.sceneImageUrl || "/images/reading-quest/scene-forest.png")} 
          alt="Scene"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
        <button 
          onClick={handleRest}
          className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full voxel-shadow flex items-center gap-3 hover:bg-white transition-colors text-lg font-bold"
        >
          <Coffee className="w-6 h-6 text-[#FF9B54]" />
          <span className="hidden sm:inline">Rest at Campfire</span>
          <span className="sm:hidden">Rest</span>
        </button>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 items-center bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <Footprints 
                key={i} 
                className={`w-4 h-4 md:w-5 md:h-5 ${i < Math.min(5, Math.ceil((chapter.sortIndex / chapter.chapterCount) * 5)) ? "text-[#A5FFD6]" : "text-white/30"}`} 
              />
            ))}
          </div>
          <span className="text-white/80 font-fredoka text-sm font-medium tracking-wide bg-black/40 px-3 py-1 rounded-full">
            Path {chapter.sortIndex} of {chapter.chapterCount}
          </span>
        </div>
      </header>

      {/* Companion */}
      <div className="absolute bottom-[45%] lg:bottom-[50%] left-[5%] w-32 h-32 md:w-48 md:h-48 z-0 animate-float pointer-events-none hidden md:block">
        <img 
          src={getImageUrl("/images/reading-quest/companion.png")} 
          alt="Companion watching"
          className="w-full h-full object-contain drop-shadow-2xl"
        />
        <div className={`absolute -top-8 right-0 bg-white/95 px-4 py-2 rounded-2xl rounded-bl-none font-fredoka text-lg font-bold shadow-lg ${pickedWord ? 'animate-pulse-soft' : ''}`}>
          {helpMode ? (pickedWord ? pickedWord.reaction : "I'm right here.") : "*gasps*"}
        </div>
      </div>

      <main className="px-4 md:px-8 w-full max-w-3xl mx-auto relative z-10">
        <div className={`bg-[#FFFDF8]/95 backdrop-blur-xl voxel-panel p-6 md:p-10 shadow-2xl relative transition-opacity ${pickedWord ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          
          <div className="absolute top-4 left-4 w-3 h-3 bg-[#FF9B54] rounded-sm" />
          <div className="absolute top-4 right-4 w-3 h-3 bg-[#84DCC6] rounded-sm" />
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-[#A5FFD6] rounded-sm" />
          <div className="absolute bottom-4 right-4 w-3 h-3 bg-[#B4A0E5] rounded-sm" />

          {helpMode && !pickedWord && (
            <div className="mb-6 bg-[#84DCC6]/15 border-2 border-dashed border-[#84DCC6] rounded-2xl px-5 py-4 flex items-center gap-3">
              <Heart className="w-6 h-6 text-[#FF9B54] flex-shrink-0" />
              <p className="font-fredoka text-lg text-[#2D3142]">
                Tap any underlined word — I'll sound it out with you. No score, no rush.
              </p>
            </div>
          )}

          <div className="prose prose-lg max-w-none text-[22px] leading-[1.8] text-[#2D3142] tracking-wide mb-10">
            {chapter.paragraphs.map((p, i) => (
              <p key={i} className="mb-6">{renderTappableParagraph(p)}</p>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t-4 border-gray-100/50 border-dashed">
            <button 
              className={`flex items-center justify-center gap-2 transition-colors font-medium text-lg w-full sm:w-auto px-6 py-3 rounded-full ${
                helpMode 
                  ? "bg-[#84DCC6]/20 text-[#2D3142] hover:bg-[#84DCC6]/30" 
                  : "text-gray-500 hover:text-[#84DCC6] hover:bg-[#84DCC6]/10"
              }`}
              onClick={() => {
                setHelpMode((v) => !v);
                handleClose();
              }}
            >
              <HelpCircle className="w-6 h-6" />
              <span>{helpMode ? "I'm okay now" : "I'm stuck on a word"}</span>
            </button>

            <button 
              onClick={handleNext}
              className="w-full sm:w-auto bg-[#A5FFD6] text-teal-900 px-8 py-4 rounded-2xl voxel-shadow font-fredoka text-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#8EF0C4] transition-colors group"
            >
              <span>{chapter.nextChapterId ? "Follow the fox" : "Finish story"}</span>
              <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {pickedWord && (
        <div className="absolute inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 animate-slide-up">
          <div className="bg-white voxel-panel w-full max-w-xl p-6 md:p-8 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <p className="font-fredoka text-sm uppercase tracking-widest text-[#84DCC6] font-bold mb-2">
              Let's sound it out
            </p>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {pickedWord.syllables.map((syl: string, i: number) => (
                <React.Fragment key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(true);
                      speak(syl, 0.7).finally(() => setIsPlaying(false));
                    }}
                    className="font-fredoka text-4xl md:text-5xl font-bold text-[#2D3142] bg-[#FFE5B4] px-4 py-2 rounded-2xl voxel-shadow hover:bg-[#FFD89A] transition-colors"
                  >
                    {syl}
                  </button>
                  {i < pickedWord.syllables.length - 1 && (
                    <span className="text-3xl text-[#FF9B54] font-bold">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="text-lg text-gray-600 mb-6">
              Whole word: <span className="font-bold text-[#2D3142]">{pickedWord.word}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleHearIt}
                disabled={isPlaying}
                className="flex-1 bg-[#FF9B54] text-white px-6 py-4 rounded-2xl voxel-shadow font-fredoka text-xl font-bold flex items-center justify-center gap-3 hover:bg-[#FF8A3D] transition-colors disabled:opacity-80"
              >
                <Volume2 className={`w-6 h-6 ${isPlaying ? "animate-pulse" : ""}`} />
                <span>{isPlaying ? "Playing…" : "Hear it"}</span>
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-[#A5FFD6] text-teal-900 px-6 py-4 rounded-2xl voxel-shadow font-fredoka text-xl font-bold hover:bg-[#8EF0C4] transition-colors"
              >
                Got it!
              </button>
            </div>

            <p className="text-center text-sm text-gray-400 mt-4 font-fredoka">
              No score change. Keep going whenever you're ready.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
