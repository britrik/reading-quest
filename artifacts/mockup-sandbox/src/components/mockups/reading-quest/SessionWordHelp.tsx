import React from "react";
import { Coffee, HelpCircle, ChevronRight, Footprints, Volume2, Heart, X } from "lucide-react";
import "./_group.css";

export function SessionWordHelp() {
  const syllables = ["care", "ful", "ly"];

  return (
    <div className="min-h-[100dvh] w-full relative font-atkinson text-[#2D3142] overflow-hidden flex flex-col justify-end pb-8">
      {/* Background */}
      <div className="absolute inset-0 -z-20">
        <img
          src="/__mockup/images/reading-quest/scene-forest.png"
          alt="Warm forest clearing"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
      </div>

      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
        <button className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full voxel-shadow flex items-center gap-3 text-lg font-bold">
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

      {/* Companion with supportive reaction */}
      <div className="absolute bottom-[55%] left-[6%] w-52 h-52 z-0 animate-float pointer-events-none">
        <img
          src="/__mockup/images/reading-quest/companion.png"
          alt="Companion cheering you on"
          className="w-full h-full object-contain drop-shadow-2xl"
        />
        <div className="absolute -top-10 -right-4 bg-white px-5 py-3 rounded-2xl rounded-bl-none font-fredoka text-xl font-bold shadow-xl">
          Nice — that's a big one!
          <span className="absolute -bottom-2 left-4 w-4 h-4 bg-white rotate-45" />
        </div>
      </div>

      {/* Reading Panel (dimmed, story still visible) */}
      <main className="px-4 md:px-8 w-full max-w-3xl mx-auto relative z-10 mb-4">
        <div className="bg-[#FFFDF8]/85 backdrop-blur-xl voxel-panel p-8 md:p-10 shadow-2xl relative opacity-90">
          <div className="mb-6 bg-[#84DCC6]/15 border-2 border-dashed border-[#84DCC6] rounded-2xl px-5 py-3 flex items-center gap-3">
            <Heart className="w-5 h-5 text-[#FF9B54] flex-shrink-0" />
            <p className="font-fredoka text-base text-[#2D3142]">
              Tap any underlined word — no score, no rush.
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-2xl leading-[1.8] text-[#2D3142] tracking-wide">
            <p className="mb-4">
              You step{" "}
              <span
                className="rq-tappable-word"
                style={{
                  background:
                    "linear-gradient(transparent 0%, rgba(255, 155, 84, 0.45) 0%)",
                  outline: "3px solid #FF9B54",
                  borderRadius: 6,
                }}
              >
                carefully
              </span>{" "}
              into the{" "}
              <span className="rq-tappable-word">glowing</span>{" "}
              <span className="rq-tappable-word">clearing</span>. The trees here
              don't have leaves—they have soft,{" "}
              <span className="rq-tappable-word">floating</span> blocks of light
              that hum <span className="rq-tappable-word">quietly</span>.
            </p>
          </div>

          <div className="flex justify-between items-center gap-6 pt-6 mt-6 border-t-4 border-gray-100/50 border-dashed">
            <button className="flex items-center gap-2 bg-[#84DCC6]/20 text-[#2D3142] font-medium text-lg px-4 py-2 rounded-full">
              <HelpCircle className="w-6 h-6" />
              <span>I'm okay now</span>
            </button>
            <button className="bg-[#A5FFD6]/70 text-teal-900 px-6 py-3 rounded-2xl voxel-shadow font-fredoka text-xl font-bold flex items-center gap-2">
              <span>Follow the fox</span>
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      {/* Word Help Sheet — focal element */}
      <div className="px-4 w-full flex justify-center z-50 animate-slide-up">
        <div className="bg-white voxel-panel w-full max-w-xl p-7 md:p-9 relative">
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <p className="font-fredoka text-sm uppercase tracking-widest text-[#84DCC6] font-bold mb-3">
            Let's sound it out
          </p>

          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {syllables.map((syl, i) => (
              <React.Fragment key={i}>
                <span className="font-fredoka text-5xl font-bold text-[#2D3142] bg-[#FFE5B4] px-5 py-3 rounded-2xl voxel-shadow">
                  {syl}
                </span>
                {i < syllables.length - 1 && (
                  <span className="text-3xl text-[#FF9B54] font-bold">·</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="text-lg text-gray-600 mb-6">
            Whole word: <span className="font-bold text-[#2D3142]">carefully</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 bg-[#FF9B54] text-white px-6 py-4 rounded-2xl voxel-shadow font-fredoka text-xl font-bold flex items-center justify-center gap-3">
              <Volume2 className="w-6 h-6" />
              <span>Hear it</span>
            </button>
            <button className="flex-1 bg-[#A5FFD6] text-teal-900 px-6 py-4 rounded-2xl voxel-shadow font-fredoka text-xl font-bold">
              Got it!
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-4">
            No score change. Keep going whenever you're ready.
          </p>
        </div>
      </div>
    </div>
  );
}
