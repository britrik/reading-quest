import React from "react";
import { Sparkles } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

export function PageLoader({ text = "Setting up your adventure..." }: { text?: string }) {
  return (
    <div className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson text-[#2D3142] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[#84DCC6] to-transparent opacity-40 pointer-events-none" />
      
      <div className="w-48 h-48 relative animate-float mb-6">
        <img 
          src={getImageUrl("/images/reading-quest/companion.png")}
          alt="Loading companion"
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 bg-[#A5FFD6] rounded-full blur-3xl opacity-30 -z-10" />
      </div>
      
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full voxel-shadow">
        <Sparkles className="w-5 h-5 text-[#FF9B54] animate-spin" />
        <span className="font-fredoka text-xl font-bold">{text}</span>
      </div>
    </div>
  );
}

export function PageError({ text = "The worlds are resting. Tap to try again whenever you're ready." }: { text?: string }) {
  return (
    <div className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson text-[#2D3142] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-48 h-48 relative animate-float mb-6 grayscale opacity-80">
        <img 
          src={getImageUrl("/images/reading-quest/companion.png")}
          alt="Resting companion"
          className="w-full h-full object-contain"
        />
      </div>
      
      <button 
        onClick={() => window.location.reload()}
        className="bg-white/80 backdrop-blur-md px-8 py-4 rounded-3xl voxel-shadow hover:-translate-y-1 transition-transform max-w-sm text-center cursor-pointer"
      >
        <span className="font-fredoka text-xl font-bold block">{text}</span>
      </button>
    </div>
  );
}
