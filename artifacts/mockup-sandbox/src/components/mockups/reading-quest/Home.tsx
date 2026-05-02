import React from "react";
import { Star, Gem, Map, Heart } from "lucide-react";
import "./_group.css";

export function Home() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson text-[#2D3142] relative overflow-hidden flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[#84DCC6] to-transparent opacity-40 pointer-events-none" />
      
      {/* Header / Top Bar */}
      <header className="p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
          <Heart className="w-6 h-6 text-[#FF9B54] fill-[#FF9B54] animate-pulse-soft" />
          <div className="flex flex-col">
            <span className="font-fredoka font-semibold text-xl text-[#FF9B54] leading-tight">Pet Level 3</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-2 bg-white/80 rounded-full overflow-hidden voxel-shadow-inner">
                <div className="h-full w-[68%] bg-gradient-to-r from-[#FF9B54] to-[#FFD166] rounded-full" />
              </div>
              <span className="font-fredoka text-xs text-[#FF9B54]/80">almost level 4!</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
            <Gem className="w-6 h-6 text-[#A5FFD6] fill-[#A5FFD6]" />
            <span className="font-fredoka font-semibold text-xl">24</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className="font-fredoka font-semibold text-xl">12</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center px-6 pb-12 relative z-10">
        
        {/* Companion Greeting Section */}
        <div className="flex flex-col items-center mb-12 mt-8">
          <div className="w-48 h-48 relative animate-float mb-6">
            <img 
              src="/__mockup/images/reading-quest/companion.png" 
              alt="Friendly floating companion"
              className="w-full h-full object-contain"
            />
            {/* Soft glow behind character */}
            <div className="absolute inset-0 bg-[#A5FFD6] rounded-full blur-3xl opacity-30 -z-10" />
          </div>
          
          <div className="bg-white/80 backdrop-blur-md px-8 py-6 rounded-3xl voxel-shadow relative max-w-lg text-center">
            {/* Speech bubble tail */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-b-[20px] border-b-white/80 border-r-[16px] border-r-transparent" />
            <h1 className="font-fredoka text-3xl font-bold mb-2">Hey there, Alex! 👋</h1>
            <p className="text-xl leading-relaxed text-gray-700">
              The worlds are looking pretty cool today. Wanna explore one together?
            </p>
          </div>
        </div>

        {/* Worlds Selection */}
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <h2 className="font-fredoka text-2xl font-bold text-[#FF9B54] ml-4 flex items-center gap-2">
            <Map className="w-6 h-6" />
            Pick your adventure
          </h2>

          {/* World Card 1 */}
          <button className="w-full bg-white rounded-3xl p-4 flex items-center gap-6 voxel-shadow hover:-translate-y-1 transition-transform text-left group">
            <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 voxel-panel">
              <img 
                src="/__mockup/images/reading-quest/world-forest.png" 
                alt="Blocky forest world"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex-1 py-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-fredoka text-2xl font-bold text-[#2D3142]">Whispering Woods</h3>
                <div className="flex gap-1">
                  <Star className="w-5 h-5 text-green-400 fill-green-400" />
                  <Star className="w-5 h-5 text-gray-200 fill-gray-200" />
                  <Star className="w-5 h-5 text-gray-200 fill-gray-200" />
                </div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Help a lost voxel-bear find its way home through the blocky trees.
              </p>
              <span className="inline-block bg-[#A5FFD6] text-teal-800 px-4 py-1.5 rounded-full font-bold font-fredoka text-sm">
                Gentle Path
              </span>
            </div>
          </button>

          {/* World Card 2 */}
          <button className="w-full bg-white rounded-3xl p-4 flex items-center gap-6 voxel-shadow hover:-translate-y-1 transition-transform text-left group">
            <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 voxel-panel border-[#84DCC6]">
              <img 
                src="/__mockup/images/reading-quest/world-sky.png" 
                alt="Anime sky island"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex-1 py-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-fredoka text-2xl font-bold text-[#2D3142]">Cloud Ruins</h3>
                <div className="flex gap-1">
                  <Star className="w-5 h-5 text-blue-400 fill-blue-400" />
                  <Star className="w-5 h-5 text-blue-400 fill-blue-400" />
                  <Star className="w-5 h-5 text-gray-200 fill-gray-200" />
                </div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Discover the secrets of the ancient floating temples in the sky.
              </p>
              <span className="inline-block bg-[#84DCC6] text-blue-800 px-4 py-1.5 rounded-full font-bold font-fredoka text-sm">
                Breezy Climb
              </span>
            </div>
          </button>

          {/* World Card 3 */}
          <button className="w-full bg-white rounded-3xl p-4 flex items-center gap-6 voxel-shadow hover:-translate-y-1 transition-transform text-left group">
            <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 voxel-panel border-[#B4A0E5]">
              <img 
                src="/__mockup/images/reading-quest/world-cave.png" 
                alt="Glowing crystal cave"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex-1 py-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-fredoka text-2xl font-bold text-[#2D3142]">Crystal Caverns</h3>
                <div className="flex gap-1">
                  <Star className="w-5 h-5 text-purple-400 fill-purple-400" />
                  <Star className="w-5 h-5 text-purple-400 fill-purple-400" />
                  <Star className="w-5 h-5 text-purple-400 fill-purple-400" />
                </div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Brave the deep caves to find the legendary glowing geodes.
              </p>
              <span className="inline-block bg-[#E5D4FF] text-purple-800 px-4 py-1.5 rounded-full font-bold font-fredoka text-sm">
                Brave Journey
              </span>
            </div>
          </button>

        </div>
      </main>
    </div>
  );
}
