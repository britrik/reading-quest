import React, { useState } from "react";
import {
  Gem,
  Star,
  Heart,
  Apple,
  Sparkles,
  Crown,
  Shirt,
  Sofa,
  Lock,
  Check,
  ArrowLeft,
  Cookie,
  Drumstick,
  Cake,
} from "lucide-react";
import "./_group.css";

type TabKey = "feed" | "dress" | "decorate";

type ShopItem = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  owned?: boolean;
  equipped?: boolean;
  locked?: boolean;
  unlockHint?: string;
};

type FoodItem = {
  id: string;
  name: string;
  icon: React.ReactNode;
  cost: number;
  fullness: number;
  happiness: number;
};

const FOODS: FoodItem[] = [
  {
    id: "berry",
    name: "Glow Berry",
    icon: <Apple className="w-7 h-7" />,
    cost: 1,
    fullness: 10,
    happiness: 5,
  },
  {
    id: "cookie",
    name: "Star Cookie",
    icon: <Cookie className="w-7 h-7" />,
    cost: 3,
    fullness: 25,
    happiness: 15,
  },
  {
    id: "drumstick",
    name: "Hearty Roast",
    icon: <Drumstick className="w-7 h-7" />,
    cost: 5,
    fullness: 45,
    happiness: 10,
  },
  {
    id: "cake",
    name: "Birthday Cake",
    icon: <Cake className="w-7 h-7" />,
    cost: 8,
    fullness: 30,
    happiness: 40,
  },
];

const HATS: ShopItem[] = [
  { id: "none", name: "No Hat", emoji: "🚫", cost: 0, owned: true, equipped: true },
  { id: "crown", name: "Tiny Crown", emoji: "👑", cost: 6, owned: true },
  { id: "wizard", name: "Wizard Hat", emoji: "🧙", cost: 10 },
  { id: "party", name: "Party Hat", emoji: "🎉", cost: 4 },
  { id: "halo", name: "Glow Halo", emoji: "😇", cost: 15, locked: true, unlockHint: "Finish Cloud Ruins" },
];

const COLORS: ShopItem[] = [
  { id: "mint", name: "Mint Glow", emoji: "🟢", cost: 0, owned: true, equipped: true },
  { id: "berry", name: "Berry Pop", emoji: "🟣", cost: 5 },
  { id: "sun", name: "Sunset", emoji: "🟠", cost: 5 },
  { id: "sky", name: "Sky Drift", emoji: "🔵", cost: 5 },
  { id: "rainbow", name: "Rainbow", emoji: "🌈", cost: 20, locked: true, unlockHint: "Reach Pet Level 5" },
];

const DECOR: ShopItem[] = [
  { id: "rug", name: "Cozy Rug", emoji: "🟫", cost: 4, owned: true, equipped: true },
  { id: "lamp", name: "Lava Lamp", emoji: "🪔", cost: 6 },
  { id: "plant", name: "Glow Plant", emoji: "🪴", cost: 3, owned: true },
  { id: "bookshelf", name: "Tiny Library", emoji: "📚", cost: 8 },
  { id: "bed", name: "Cloud Bed", emoji: "☁️", cost: 10 },
  { id: "window", name: "Star Window", emoji: "🌌", cost: 12, locked: true, unlockHint: "Read 5 chapters" },
];

export function PetDen() {
  const [gems, setGems] = useState(24);
  const [stars] = useState(12);
  const [fullness, setFullness] = useState(55);
  const [happiness, setHappiness] = useState(70);
  const [tab, setTab] = useState<TabKey>("feed");
  const [hatId, setHatId] = useState("crown");
  const [colorId, setColorId] = useState("mint");
  const [decorIds, setDecorIds] = useState<string[]>(["rug", "plant"]);
  const [ownedHatIds, setOwnedHatIds] = useState<string[]>(
    HATS.filter((h) => h.owned).map((h) => h.id),
  );
  const [ownedColorIds, setOwnedColorIds] = useState<string[]>(
    COLORS.filter((c) => c.owned).map((c) => c.id),
  );
  const [ownedDecorIds, setOwnedDecorIds] = useState<string[]>(
    DECOR.filter((d) => d.owned).map((d) => d.id),
  );
  const [pulseHeart, setPulseHeart] = useState(false);
  const [floatText, setFloatText] = useState<{ id: number; text: string; x: number } | null>(null);
  const [bounceKey, setBounceKey] = useState(0);

  const showFloat = (text: string) => {
    const id = Date.now();
    setFloatText({ id, text, x: 30 + Math.random() * 40 });
    setTimeout(() => setFloatText((f) => (f && f.id === id ? null : f)), 1400);
  };

  const handleFeed = (food: FoodItem) => {
    if (gems < food.cost) return;
    setGems((g) => g - food.cost);
    setFullness((f) => Math.min(100, f + food.fullness));
    setHappiness((h) => Math.min(100, h + food.happiness));
    setPulseHeart(true);
    setBounceKey((k) => k + 1);
    setTimeout(() => setPulseHeart(false), 600);
    showFloat(food.name === "Glow Berry" ? "yum!" : food.name === "Birthday Cake" ? "🎂 yay!!" : "nom nom");
  };

  const tryBuyOrEquip = (item: ShopItem, kind: "hat" | "color" | "decor") => {
    if (item.locked) return;
    const ownedList =
      kind === "hat" ? ownedHatIds : kind === "color" ? ownedColorIds : ownedDecorIds;
    const isOwned = ownedList.includes(item.id);

    if (!isOwned) {
      if (gems < item.cost) return;
      setGems((g) => g - item.cost);
      if (kind === "hat") setOwnedHatIds((ids) => [...ids, item.id]);
      if (kind === "color") setOwnedColorIds((ids) => [...ids, item.id]);
      if (kind === "decor") setOwnedDecorIds((ids) => [...ids, item.id]);
      setHappiness((h) => Math.min(100, h + 5));
      showFloat("✨ new!");
    }

    if (kind === "hat") setHatId(item.id);
    if (kind === "color") setColorId(item.id);
    if (kind === "decor") {
      setDecorIds((ids) =>
        ids.includes(item.id) ? ids.filter((x) => x !== item.id) : [...ids, item.id],
      );
    }
    setBounceKey((k) => k + 1);
  };

  const equippedHat = HATS.find((h) => h.id === hatId);
  const equippedColor = COLORS.find((c) => c.id === colorId);

  const colorTint: Record<string, string> = {
    mint: "drop-shadow(0 0 30px #A5FFD6)",
    berry: "drop-shadow(0 0 30px #B4A0E5) hue-rotate(40deg)",
    sun: "drop-shadow(0 0 30px #FFB07A) hue-rotate(-20deg) saturate(1.3)",
    sky: "drop-shadow(0 0 30px #84DCC6) hue-rotate(20deg)",
    rainbow: "drop-shadow(0 0 30px #FF9B54) hue-rotate(80deg) saturate(1.5)",
  };

  const equippedDecor = DECOR.filter((d) => decorIds.includes(d.id));

  const moodLabel =
    happiness > 80 ? "ecstatic!" : happiness > 55 ? "happy" : happiness > 30 ? "okay" : "lonely…";

  return (
    <div className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson text-[#2D3142] relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[55%] bg-gradient-to-b from-[#B4A0E5]/40 via-[#84DCC6]/30 to-transparent pointer-events-none" />
      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute text-white/60 animate-float"
            style={{
              top: `${10 + (i * 11) % 70}%`,
              left: `${5 + (i * 17) % 90}%`,
              width: 16 + (i % 3) * 6,
              height: 16 + (i % 3) * 6,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="p-6 flex justify-between items-center relative z-20">
        <button className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow hover:-translate-y-0.5 transition-transform">
          <ArrowLeft className="w-5 h-5 text-[#2D3142]" />
          <span className="font-fredoka font-semibold">Back to map</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
            <Gem className="w-6 h-6 text-[#84DCC6] fill-[#A5FFD6]" />
            <span className="font-fredoka font-semibold text-xl tabular-nums">{gems}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className="font-fredoka font-semibold text-xl tabular-nums">{stars}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 px-6 pb-8 relative z-10 max-w-7xl mx-auto w-full">
        {/* === LEFT: The Den Scene === */}
        <section className="flex-1 flex flex-col">
          {/* Title */}
          <div className="mb-3 flex items-end justify-between flex-wrap gap-2">
            <div>
              <p className="font-fredoka text-sm uppercase tracking-widest text-[#FF9B54] font-bold">
                Sparky's Den
              </p>
              <h1 className="font-fredoka text-3xl font-bold">A cozy hangout 🏡</h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow flex items-center gap-2">
              <Heart
                className={`w-5 h-5 text-[#FF9B54] fill-[#FF9B54] ${pulseHeart ? "animate-pulse-soft" : ""}`}
              />
              <span className="font-fredoka font-semibold">Pet Level 3</span>
            </div>
          </div>

          {/* The room itself */}
          <div className="relative flex-1 min-h-[420px] bg-gradient-to-b from-[#FFD89A] to-[#FFB07A] voxel-panel overflow-hidden">
            {/* Wall pattern */}
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0, 0 12px",
              }}
            />

            {/* Floor */}
            <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-b from-[#8B5E3C] to-[#6B4226]">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(0,0,0,0.3) 60px, rgba(0,0,0,0.3) 62px)",
                }}
              />
            </div>

            {/* Equipped decor row */}
            <div className="absolute bottom-[35%] left-0 right-0 flex justify-around items-end px-8 pb-2 pointer-events-none">
              {equippedDecor.map((d, i) => (
                <span
                  key={d.id}
                  className="text-5xl md:text-6xl animate-float"
                  style={{
                    animationDelay: `${i * 0.6}s`,
                    filter: "drop-shadow(2px 4px 0 rgba(0,0,0,0.2))",
                  }}
                >
                  {d.emoji}
                </span>
              ))}
            </div>

            {/* The pet (companion) */}
            <div
              key={bounceKey}
              className="absolute left-1/2 -translate-x-1/2 bottom-[28%] w-44 h-44 md:w-56 md:h-56 animate-float"
              style={{ filter: equippedColor ? colorTint[equippedColor.id] : undefined }}
            >
              <img
                src="/__mockup/images/reading-quest/companion.png"
                alt="Your pet companion"
                className="w-full h-full object-contain"
                style={{ animation: "slide-up 350ms ease-out" }}
              />
              {/* Hat sits above */}
              {equippedHat && equippedHat.id !== "none" && (
                <span
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl md:text-6xl"
                  style={{ filter: "drop-shadow(2px 3px 0 rgba(0,0,0,0.25))" }}
                >
                  {equippedHat.emoji}
                </span>
              )}
              {/* Mood bubble */}
              <div className="absolute -top-10 -right-6 bg-white px-3 py-1 rounded-2xl rounded-bl-none font-fredoka text-sm font-bold shadow-md">
                {moodLabel}
              </div>
            </div>

            {/* Floating reaction text */}
            {floatText && (
              <div
                className="absolute bottom-[55%] font-fredoka text-2xl font-bold text-[#FF9B54] pointer-events-none animate-slide-up"
                style={{ left: `${floatText.x}%` }}
              >
                {floatText.text}
              </div>
            )}

            {/* Status meters */}
            <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 max-w-xs">
              <Meter
                label="Fullness"
                value={fullness}
                color="from-[#FF9B54] to-[#FFD166]"
                icon={<Apple className="w-4 h-4 text-[#FF9B54]" />}
              />
              <Meter
                label="Happiness"
                value={happiness}
                color="from-[#B4A0E5] to-[#FFA0E5]"
                icon={<Heart className="w-4 h-4 text-[#B4A0E5] fill-[#B4A0E5]" />}
              />
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 mt-3 font-fredoka">
            Tap stuff on the right — no reading needed, just play!
          </p>
        </section>

        {/* === RIGHT: Shop / Care Panel === */}
        <aside className="lg:w-[420px] flex flex-col gap-4">
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-2xl voxel-shadow">
            <TabButton active={tab === "feed"} onClick={() => setTab("feed")} icon={<Apple className="w-5 h-5" />} label="Feed" />
            <TabButton active={tab === "dress"} onClick={() => setTab("dress")} icon={<Shirt className="w-5 h-5" />} label="Dress Up" />
            <TabButton active={tab === "decorate"} onClick={() => setTab("decorate")} icon={<Sofa className="w-5 h-5" />} label="Decorate" />
          </div>

          {/* Tab content */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl voxel-shadow p-5 flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none">
            {tab === "feed" && (
              <div>
                <h3 className="font-fredoka text-xl font-bold mb-3 flex items-center gap-2">
                  <Apple className="w-5 h-5 text-[#FF9B54]" /> Snack time
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {FOODS.map((f) => {
                    const can = gems >= f.cost;
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleFeed(f)}
                        disabled={!can}
                        className={`p-4 rounded-2xl voxel-shadow text-left transition-all hover:-translate-y-0.5 ${
                          can ? "bg-[#FFE5B4] hover:bg-[#FFD89A]" : "bg-gray-100 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#FF9B54]">{f.icon}</span>
                          <span className="flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-full text-sm font-fredoka font-bold">
                            <Gem className="w-3 h-3 text-[#84DCC6] fill-[#A5FFD6]" />
                            {f.cost}
                          </span>
                        </div>
                        <p className="font-fredoka font-bold">{f.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          +{f.fullness} full · +{f.happiness} happy
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "dress" && (
              <div className="flex flex-col gap-5">
                <ShopGrid
                  title="Hats"
                  icon={<Crown className="w-5 h-5 text-[#FF9B54]" />}
                  items={HATS}
                  selectedId={hatId}
                  ownedIds={ownedHatIds}
                  gems={gems}
                  onPick={(it) => tryBuyOrEquip(it, "hat")}
                />
                <ShopGrid
                  title="Glow color"
                  icon={<Sparkles className="w-5 h-5 text-[#B4A0E5]" />}
                  items={COLORS}
                  selectedId={colorId}
                  ownedIds={ownedColorIds}
                  gems={gems}
                  onPick={(it) => tryBuyOrEquip(it, "color")}
                />
              </div>
            )}

            {tab === "decorate" && (
              <div>
                <ShopGrid
                  title="Den stuff"
                  icon={<Sofa className="w-5 h-5 text-[#84DCC6]" />}
                  items={DECOR}
                  selectedIds={decorIds}
                  ownedIds={ownedDecorIds}
                  gems={gems}
                  onPick={(it) => tryBuyOrEquip(it, "decor")}
                  multi
                />
                <p className="text-xs text-gray-500 mt-3 font-fredoka">
                  Tap to add or remove from your den.
                </p>
              </div>
            )}
          </div>

          {/* Footer cta */}
          <div className="bg-[#A5FFD6]/70 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 voxel-shadow">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-400 flex-shrink-0" />
            <p className="text-sm font-fredoka">
              Read another chapter to earn <span className="font-bold">+5 gems</span>!
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Meter({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 voxel-shadow">
      {icon}
      <span className="font-fredoka text-xs font-bold w-20">{label}</span>
      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-fredoka text-xs font-bold tabular-nums w-8 text-right">{value}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-3 rounded-xl font-fredoka font-bold flex items-center justify-center gap-1.5 transition-colors text-sm md:text-base ${
        active
          ? "bg-[#FF9B54] text-white voxel-shadow"
          : "text-[#2D3142] hover:bg-white/60"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ShopGrid({
  title,
  icon,
  items,
  selectedId,
  selectedIds,
  ownedIds,
  gems,
  onPick,
  multi = false,
}: {
  title: string;
  icon: React.ReactNode;
  items: ShopItem[];
  selectedId?: string;
  selectedIds?: string[];
  ownedIds: string[];
  gems: number;
  onPick: (item: ShopItem) => void;
  multi?: boolean;
}) {
  return (
    <div>
      <h3 className="font-fredoka text-lg font-bold mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const isSelected = multi
            ? (selectedIds ?? []).includes(item.id)
            : selectedId === item.id;
          const isOwned = ownedIds.includes(item.id);
          const canAfford = gems >= item.cost;
          const disabled = item.locked || (!isOwned && !canAfford);

          return (
            <button
              key={item.id}
              onClick={() => onPick(item)}
              disabled={disabled}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all ${
                isSelected
                  ? "bg-[#A5FFD6] voxel-shadow ring-2 ring-[#2D3142]"
                  : isOwned
                  ? "bg-[#FFE5B4] voxel-shadow hover:-translate-y-0.5"
                  : item.locked
                  ? "bg-gray-100 opacity-70 cursor-not-allowed"
                  : canAfford
                  ? "bg-white voxel-shadow hover:-translate-y-0.5 hover:bg-[#FFE5B4]/60"
                  : "bg-gray-100 opacity-60 cursor-not-allowed"
              }`}
              title={item.locked ? item.unlockHint : item.name}
            >
              <span className="text-3xl mb-1" style={{ filter: "drop-shadow(1px 2px 0 rgba(0,0,0,0.15))" }}>
                {item.emoji}
              </span>
              <span className="font-fredoka text-[10px] font-bold text-center leading-tight">
                {item.name}
              </span>

              {/* Status badge */}
              {item.locked ? (
                <span className="absolute top-1 right-1 bg-gray-700 text-white rounded-full p-1">
                  <Lock className="w-3 h-3" />
                </span>
              ) : isSelected ? (
                <span className="absolute top-1 right-1 bg-[#2D3142] text-white rounded-full p-1">
                  <Check className="w-3 h-3" />
                </span>
              ) : isOwned ? (
                <span className="absolute top-1 right-1 bg-white/90 rounded-full px-1.5 text-[9px] font-fredoka font-bold text-gray-600">
                  owned
                </span>
              ) : (
                <span className="absolute top-1 right-1 bg-white/90 rounded-full px-1.5 py-0.5 text-[10px] font-fredoka font-bold flex items-center gap-0.5">
                  <Gem className="w-2.5 h-2.5 text-[#84DCC6] fill-[#A5FFD6]" />
                  {item.cost}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
