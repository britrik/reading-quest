import React, { useState } from "react";
import { Coffee, HelpCircle, ChevronRight, Gem, Footprints, Sparkles } from "lucide-react";
import "./_group.css";

export function Session() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-[100dvh] w-full relative font-atkinson text-[#2D3142] overflow-hidden flex flex-col justify-end pb-8">
      {/* Immersive Background */}
      <div className="absolute inset-0 -z-20">
        <img 
          src="/__mockup/images/reading-quest/scene-forest.png" 
          alt="Warm forest clearing"
          className="w-full h-full object-cover"
        />
        {/* Overlay to ensure text readability */}
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

      {/* Scene Elements (Companion) */}
      <div className="absolute bottom-[45%] left-[5%] w-48 h-48 z-0 animate-float pointer-events-none">
        <img 
          src="/__mockup/images/reading-quest/companion.png" 
          alt="Companion watching"
          className="w-full h-full object-contain drop-shadow-2xl"
        />
        <div className="absolute -top-8 right-0 bg-white/90 px-4 py-2 rounded-2xl rounded-bl-none font-fredoka text-lg font-bold shadow-lg animate-pulse-soft">
          *gasps*
        </div>
      </div>

      {/* Main Reading Panel */}
      <main className="px-4 md:px-8 w-full max-w-3xl mx-auto relative z-10">
        <div className="bg-[#FFFDF8]/95 backdrop-blur-xl voxel-panel p-8 md:p-10 shadow-2xl relative">
          
          {/* Subtle decorative corners */}
          <div className="absolute top-4 left-4 w-3 h-3 bg-[#FF9B54] rounded-sm" />
          <div className="absolute top-4 right-4 w-3 h-3 bg-[#84DCC6] rounded-sm" />
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-[#A5FFD6] rounded-sm" />
          <div className="absolute bottom-4 right-4 w-3 h-3 bg-[#B4A0E5] rounded-sm" />

          {/* Reading Content */}
          <div className="prose prose-lg max-w-none text-2xl leading-[1.8] text-[#2D3142] tracking-wide mb-10">
            <p className="mb-6">
              You step carefully into the glowing clearing. The trees here don't have leaves—they have soft, floating blocks of light that hum quietly.
            </p>
            <p>
              A small fox with a tail made of stardust pokes its head out from behind a glowing stump. It blinks its big eyes at you, then slowly waves a paw. It looks like it wants you to follow it deeper into the woods.
            </p>
          </div>

          {/* Action Area */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t-4 border-gray-100/50 border-dashed">
            
            {/* Help affordance */}
            <button 
              className="flex items-center gap-2 text-gray-500 hover:text-[#84DCC6] transition-colors font-medium text-lg px-4 py-2 rounded-full hover:bg-[#84DCC6]/10"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="w-6 h-6" />
              <span>I'm stuck on a word</span>
            </button>

            {/* Next section */}
            <button className="w-full sm:w-auto bg-[#A5FFD6] text-teal-900 px-8 py-4 rounded-2xl voxel-shadow font-fredoka text-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#8EF0C4] transition-colors group">
              <span>Follow the fox</span>
              <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>

          {/* Fun little interaction point */}
          <button className="absolute -right-6 top-1/2 -translate-y-1/2 bg-[#FF9B54] w-16 h-16 rounded-full voxel-shadow flex items-center justify-center hover:scale-110 transition-transform group">
            <Gem className="w-8 h-8 text-white group-hover:animate-spin" />
            <span className="absolute -top-10 bg-white px-3 py-1 rounded-full text-sm font-bold font-fredoka text-[#FF9B54] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Grab it!
            </span>
          </button>

        </div>
      </main>

      {/* Help Overlay (Mock) */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl voxel-panel max-w-sm text-center">
            <Sparkles className="w-12 h-12 text-[#FF9B54] mx-auto mb-4" />
            <h3 className="font-fredoka text-2xl font-bold mb-4">You're doing great!</h3>
            <p className="text-lg mb-8">
              Tap any word in the story that looks tricky, and I'll sound it out for you.
            </p>
            <button 
              className="bg-gray-100 px-6 py-3 rounded-full font-bold text-gray-600 hover:bg-gray-200 transition-colors w-full"
              onClick={() => setShowHelp(false)}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
