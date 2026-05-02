import React, { useState } from "react";
import { Coffee, HelpCircle, ChevronRight, Gem, Footprints, Volume2, Heart, X } from "lucide-react";
import "./_group.css";

type WordEntry = {
  word: string;
  syllables: string[];
  reaction: string;
};

const TRICKY_WORDS: Record<string, WordEntry> = {
  carefully: {
    word: "carefully",
    syllables: ["care", "ful", "ly"],
    reaction: "Nice — that's a big one!",
  },
  glowing: {
    word: "glowing",
    syllables: ["glow", "ing"],
    reaction: "You got it!",
  },
  clearing: {
    word: "clearing",
    syllables: ["clear", "ing"],
    reaction: "Easy peasy!",
  },
  floating: {
    word: "floating",
    syllables: ["float", "ing"],
    reaction: "Smooth!",
  },
  quietly: {
    word: "quietly",
    syllables: ["qui", "et", "ly"],
    reaction: "Tricky one — well done!",
  },
  stardust: {
    word: "stardust",
    syllables: ["star", "dust"],
    reaction: "Sparkly word!",
  },
  behind: {
    word: "behind",
    syllables: ["be", "hind"],
    reaction: "Got it!",
  },
  slowly: {
    word: "slowly",
    syllables: ["slow", "ly"],
    reaction: "Take your time.",
  },
  follow: {
    word: "follow",
    syllables: ["fol", "low"],
    reaction: "Yes!",
  },
  deeper: {
    word: "deeper",
    syllables: ["deep", "er"],
    reaction: "Good one!",
  },
};

function renderTappableParagraph(text: string, helpMode: boolean, onPick: (key: string) => void) {
  const tokens = text.split(/(\s+)/);
  return tokens.map((tok, i) => {
    if (/^\s+$/.test(tok)) return <React.Fragment key={i}>{tok}</React.Fragment>;
    const cleanKey = tok.toLowerCase().replace(/[^a-z]/g, "");
    const entry = TRICKY_WORDS[cleanKey];
    if (helpMode && entry) {
      return (
        <button
          key={i}
          onClick={() => onPick(cleanKey)}
          className="rq-tappable-word"
          type="button"
        >
          {tok}
        </button>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

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

async function speakWordHelp(entry: WordEntry): Promise<void> {
  for (const syl of entry.syllables) {
    await speak(syl, 0.7);
    await new Promise((r) => setTimeout(r, 180));
  }
  await new Promise((r) => setTimeout(r, 200));
  await speak(entry.word, 0.9);
}

export function Session() {
  const [helpMode, setHelpMode] = useState(false);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const picked = pickedKey ? TRICKY_WORDS[pickedKey] : null;

  const handlePickWord = (key: string) => {
    setPickedKey(key);
    const entry = TRICKY_WORDS[key];
    if (!entry) return;
    setIsPlaying(true);
    void speakWordHelp(entry).finally(() => setIsPlaying(false));
  };

  const handleHearIt = () => {
    if (!picked) return;
    setIsPlaying(true);
    void speakWordHelp(picked).finally(() => setIsPlaying(false));
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setPickedKey(null);
  };

  const paragraph1 =
    "You step carefully into the glowing clearing. The trees here don't have leaves—they have soft, floating blocks of light that hum quietly.";
  const paragraph2 =
    "A small fox with a tail made of stardust pokes its head out from behind a glowing stump. It blinks its big eyes at you, then slowly waves a paw. It looks like it wants you to follow it deeper into the woods.";

  return (
    <div className="min-h-[100dvh] w-full relative font-atkinson text-[#2D3142] overflow-hidden flex flex-col justify-end pb-8">
      {/* Immersive Background */}
      <div className="absolute inset-0 -z-20">
        <img 
          src="/__mockup/images/reading-quest/scene-forest.png" 
          alt="Warm forest clearing"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Top Bar / Progress */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
        <button className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full voxel-shadow flex items-center gap-3 hover:bg-white transition-colors text-lg font-bold">
          <Coffee className="w-6 h-6 text-[#FF9B54]" />
          <span>Rest at Campfire</span>
        </button>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 items-center bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
            <Footprints className="w-5 h-5 text-[#A5FFD6]" />
            <Footprints className="w-5 h-5 text-[#A5FFD6]" />
            <Footprints className="w-5 h-5 text-white/30" />
            <Footprints className="w-5 h-5 text-white/30" />
            <Footprints className="w-5 h-5 text-white/30" />
          </div>
          <span className="text-white/80 font-fredoka text-sm font-medium tracking-wide bg-black/40 px-3 py-1 rounded-full">
            Path 2 of 5
          </span>
        </div>
      </header>

      {/* Companion */}
      <div className="absolute bottom-[45%] left-[5%] w-48 h-48 z-0 animate-float pointer-events-none">
        <img 
          src="/__mockup/images/reading-quest/companion.png" 
          alt="Companion watching"
          className="w-full h-full object-contain drop-shadow-2xl"
        />
        <div className="absolute -top-8 right-0 bg-white/95 px-4 py-2 rounded-2xl rounded-bl-none font-fredoka text-lg font-bold shadow-lg animate-pulse-soft">
          {helpMode ? (picked ? picked.reaction : "I'm right here.") : "*gasps*"}
        </div>
      </div>

      {/* Main Reading Panel */}
      <main className="px-4 md:px-8 w-full max-w-3xl mx-auto relative z-10">
        <div className="bg-[#FFFDF8]/95 backdrop-blur-xl voxel-panel p-8 md:p-10 shadow-2xl relative">
          
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-3 h-3 bg-[#FF9B54] rounded-sm" />
          <div className="absolute top-4 right-4 w-3 h-3 bg-[#84DCC6] rounded-sm" />
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-[#A5FFD6] rounded-sm" />
          <div className="absolute bottom-4 right-4 w-3 h-3 bg-[#B4A0E5] rounded-sm" />

          {/* Help-mode hint banner */}
          {helpMode && !picked && (
            <div className="mb-6 bg-[#84DCC6]/15 border-2 border-dashed border-[#84DCC6] rounded-2xl px-5 py-4 flex items-center gap-3">
              <Heart className="w-6 h-6 text-[#FF9B54] flex-shrink-0" />
              <p className="font-fredoka text-lg text-[#2D3142]">
                Tap any underlined word — I'll sound it out with you. No score, no rush.
              </p>
            </div>
          )}

          {/* Reading Content */}
          <div className="prose prose-lg max-w-none text-2xl leading-[1.8] text-[#2D3142] tracking-wide mb-10">
            <p className="mb-6">
              {renderTappableParagraph(paragraph1, helpMode, handlePickWord)}
            </p>
            <p>
              {renderTappableParagraph(paragraph2, helpMode, handlePickWord)}
            </p>
          </div>

          {/* Action Area */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t-4 border-gray-100/50 border-dashed">
            
            <button 
              className={`flex items-center gap-2 transition-colors font-medium text-lg px-4 py-2 rounded-full ${
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

            <button className="w-full sm:w-auto bg-[#A5FFD6] text-teal-900 px-8 py-4 rounded-2xl voxel-shadow font-fredoka text-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#8EF0C4] transition-colors group">
              <span>Follow the fox</span>
              <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>

          {/* Gem */}
          <button className="absolute -right-6 top-1/2 -translate-y-1/2 bg-[#FF9B54] w-16 h-16 rounded-full voxel-shadow flex items-center justify-center hover:scale-110 transition-transform group">
            <Gem className="w-8 h-8 text-white group-hover:animate-spin" />
            <span className="absolute -top-10 bg-white px-3 py-1 rounded-full text-sm font-bold font-fredoka text-[#FF9B54] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Grab it!
            </span>
          </button>

        </div>
      </main>

      {/* Word Help Sheet */}
      {picked && (
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
              {picked.syllables.map((syl, i) => (
                <React.Fragment key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(true);
                      void speak(syl, 0.7).finally(() => setIsPlaying(false));
                    }}
                    className="font-fredoka text-4xl md:text-5xl font-bold text-[#2D3142] bg-[#FFE5B4] px-4 py-2 rounded-2xl voxel-shadow hover:bg-[#FFD89A] transition-colors"
                  >
                    {syl}
                  </button>
                  {i < picked.syllables.length - 1 && (
                    <span className="text-3xl text-[#FF9B54] font-bold">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="text-lg text-gray-600 mb-6">
              Whole word: <span className="font-bold text-[#2D3142]">{picked.word}</span>
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

            <p className="text-center text-sm text-gray-400 mt-4">
              No score change. Keep going whenever you're ready.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
