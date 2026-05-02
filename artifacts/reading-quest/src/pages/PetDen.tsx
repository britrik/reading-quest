import React, { useState } from "react";
import { Link } from "wouter";
import {
  Gem, Star, Heart, Apple, Sparkles, Crown, Shirt, Sofa, Lock, Check, ArrowLeft, Cookie, Drumstick, Cake
} from "lucide-react";
import { 
  useGetPet, 
  useListShopItems, 
  useFeedPet, 
  useEquipPetItem, 
  useTogglePetDecor, 
  usePurchaseShopItem,
  getGetPetQueryKey,
  getListShopItemsQueryKey,
  getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLoader, PageError } from "@/components/PageStates";
import { getImageUrl } from "@/lib/utils";
import type { ShopItem, PetState } from "@workspace/api-client-react/src/generated/api.schemas";

type TabKey = "feed" | "dress" | "decorate";

export default function PetDen() {
  const queryClient = useQueryClient();
  const { data: pet, isLoading: petLoading, error: petError } = useGetPet();
  const { data: shopItems, isLoading: shopLoading, error: shopError } = useListShopItems();
  
  const feedPet = useFeedPet();
  const equipPetItem = useEquipPetItem();
  const togglePetDecor = useTogglePetDecor();
  const purchaseShopItem = usePurchaseShopItem();

  const [tab, setTab] = useState<TabKey>("feed");
  const [pulseHeart, setPulseHeart] = useState(false);
  const [floatText, setFloatText] = useState<{ id: number; text: string; x: number } | null>(null);
  const [bounceKey, setBounceKey] = useState(0);

  if (petLoading || shopLoading) return <PageLoader text="Opening the den..." />;
  if (petError || shopError || !pet || !shopItems) return <PageError />;

  const foods = shopItems.filter(i => i.kind === "snack");
  const hats = shopItems.filter(i => i.kind === "hat");
  const colors = shopItems.filter(i => i.kind === "glow");
  const decors = shopItems.filter(i => i.kind === "decor");

  const showFloat = (text: string) => {
    const id = Date.now();
    setFloatText({ id, text, x: 30 + Math.random() * 40 });
    setTimeout(() => setFloatText((f) => (f && f.id === id ? null : f)), 1400);
  };

  const updatePetState = (newPetState: PetState) => {
    queryClient.setQueryData(getGetPetQueryKey(), newPetState);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }); // Refresh gems in me
    queryClient.invalidateQueries({ queryKey: getListShopItemsQueryKey() }); // Refresh owned status
  };

  const handleFeed = (food: ShopItem) => {
    if (pet.gems < food.gemPrice) return;
    feedPet.mutate({ data: { itemId: food.id } }, {
      onSuccess: (newPet) => {
        updatePetState(newPet);
        setPulseHeart(true);
        setBounceKey(k => k + 1);
        setTimeout(() => setPulseHeart(false), 600);
        showFloat("yum!");
      }
    });
  };

  const tryBuyOrEquip = (item: ShopItem, kind: "hat" | "color" | "decor") => {
    if (item.locked) return;
    
    const isOwned = item.owned;
    
    if (!isOwned) {
      if (pet.gems < item.gemPrice) return;
      purchaseShopItem.mutate({ data: { itemId: item.id } }, {
        onSuccess: (newPet) => {
          updatePetState(newPet);
          showFloat("✨ new!");
          setBounceKey(k => k + 1);
          // auto equip if it's a hat or color
          if (kind === "hat") equipPetItem.mutate({ data: { slot: "hat", itemId: item.id } }, { onSuccess: updatePetState });
          if (kind === "color") equipPetItem.mutate({ data: { slot: "glow", itemId: item.id } }, { onSuccess: updatePetState });
          if (kind === "decor") togglePetDecor.mutate({ data: { itemId: item.id, on: true } }, { onSuccess: updatePetState });
        }
      });
      return;
    }

    if (kind === "hat") {
      equipPetItem.mutate({ data: { slot: "hat", itemId: item.id } }, { onSuccess: updatePetState });
    }
    if (kind === "color") {
      equipPetItem.mutate({ data: { slot: "glow", itemId: item.id } }, { onSuccess: updatePetState });
    }
    if (kind === "decor") {
      const isEquipped = pet.decor.includes(item.id);
      togglePetDecor.mutate({ data: { itemId: item.id, on: !isEquipped } }, { onSuccess: updatePetState });
    }
    setBounceKey(k => k + 1);
  };

  const unequipHat = () => {
    equipPetItem.mutate({ data: { slot: "hat", itemId: null } }, { onSuccess: updatePetState });
  }

  const equippedHat = shopItems.find(i => i.id === pet.equippedHat);
  const equippedColor = shopItems.find(i => i.id === pet.glowColor);
  const equippedDecor = shopItems.filter(i => pet.decor.includes(i.id));

  const moodLabel = pet.mood === "ecstatic" ? "ecstatic!" : pet.mood === "happy" ? "happy" : pet.mood === "okay" ? "okay" : "lonely…";

  const getFoodIcon = (name: string) => {
    if (name.includes("Berry")) return <Apple className="w-7 h-7" />;
    if (name.includes("Cookie")) return <Cookie className="w-7 h-7" />;
    if (name.includes("Cake")) return <Cake className="w-7 h-7" />;
    if (name.includes("Roast")) return <Drumstick className="w-7 h-7" />;
    return <Apple className="w-7 h-7" />;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#FFE5B4] font-atkinson text-[#2D3142] relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-[55%] bg-gradient-to-b from-[#B4A0E5]/40 via-[#84DCC6]/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
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

      <header className="p-6 flex justify-between items-center relative z-20">
        <Link href="/" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow hover:-translate-y-0.5 transition-transform">
          <ArrowLeft className="w-5 h-5 text-[#2D3142]" />
          <span className="font-fredoka font-semibold">Back to map</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
            <Gem className="w-6 h-6 text-[#84DCC6] fill-[#A5FFD6]" />
            <span className="font-fredoka font-semibold text-xl tabular-nums">{pet.gems}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className="font-fredoka font-semibold text-xl tabular-nums">{pet.stars}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 px-6 pb-8 relative z-10 max-w-7xl mx-auto w-full">
        {/* LEFT: Scene */}
        <section className="flex-1 flex flex-col">
          <div className="mb-3 flex items-end justify-between flex-wrap gap-2">
            <div>
              <p className="font-fredoka text-sm uppercase tracking-widest text-[#FF9B54] font-bold">
                Sparky's Den
              </p>
              <h1 className="font-fredoka text-3xl font-bold">A cozy hangout 🏡</h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full voxel-shadow flex items-center gap-2">
              <Heart className={`w-5 h-5 text-[#FF9B54] fill-[#FF9B54] ${pulseHeart ? "animate-pulse-soft" : ""}`} />
              <span className="font-fredoka font-semibold">Pet Level {pet.level}</span>
            </div>
          </div>

          <div className="relative flex-1 min-h-[420px] bg-gradient-to-b from-[#FFD89A] to-[#FFB07A] voxel-panel overflow-hidden">
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0, 0 12px",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-b from-[#8B5E3C] to-[#6B4226]">
              <div
                className="absolute inset-0 opacity-30"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(0,0,0,0.3) 60px, rgba(0,0,0,0.3) 62px)" }}
              />
            </div>

            <div className="absolute bottom-[35%] left-0 right-0 flex justify-around items-end px-8 pb-2 pointer-events-none">
              {equippedDecor.map((d, i) => (
                <span
                  key={d.id}
                  className="text-5xl md:text-6xl animate-float"
                  style={{ animationDelay: `${i * 0.6}s`, filter: "drop-shadow(2px 4px 0 rgba(0,0,0,0.2))" }}
                >
                  {d.emoji}
                </span>
              ))}
            </div>

            <div
              key={bounceKey}
              className="absolute left-1/2 -translate-x-1/2 bottom-[28%] w-44 h-44 md:w-56 md:h-56 animate-float"
              style={{ filter: equippedColor ? `drop-shadow(0 0 30px ${equippedColor.glowColor})` : undefined }}
            >
              <img
                src={getImageUrl("/images/reading-quest/companion.png")}
                alt="Your pet companion"
                className="w-full h-full object-contain"
                style={{ animation: "slide-up 350ms ease-out" }}
              />
              {equippedHat && (
                <span
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl md:text-6xl"
                  style={{ filter: "drop-shadow(2px 3px 0 rgba(0,0,0,0.25))" }}
                >
                  {equippedHat.emoji}
                </span>
              )}
              <div className="absolute -top-10 -right-6 bg-white px-3 py-1 rounded-2xl rounded-bl-none font-fredoka text-sm font-bold shadow-md">
                {moodLabel}
              </div>
            </div>

            {floatText && (
              <div
                className="absolute bottom-[55%] font-fredoka text-2xl font-bold text-[#FF9B54] pointer-events-none animate-slide-up z-30"
                style={{ left: `${floatText.x}%` }}
              >
                {floatText.text}
              </div>
            )}

            <div className="absolute top-4 left-4 right-4 flex flex-col gap-2 max-w-xs z-30">
              <Meter label="Fullness" value={pet.fullness} color="from-[#FF9B54] to-[#FFD166]" icon={<Apple className="w-4 h-4 text-[#FF9B54]" />} />
              <Meter label="Happiness" value={pet.happiness} color="from-[#B4A0E5] to-[#FFA0E5]" icon={<Heart className="w-4 h-4 text-[#B4A0E5] fill-[#B4A0E5]" />} />
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-3 font-fredoka">
            Tap stuff on the right — no reading needed, just play!
          </p>
        </section>

        {/* RIGHT: Shop */}
        <aside className="lg:w-[420px] flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-2xl voxel-shadow">
            <TabButton active={tab === "feed"} onClick={() => setTab("feed")} icon={<Apple className="w-5 h-5" />} label="Feed" />
            <TabButton active={tab === "dress"} onClick={() => setTab("dress")} icon={<Shirt className="w-5 h-5" />} label="Dress Up" />
            <TabButton active={tab === "decorate"} onClick={() => setTab("decorate")} icon={<Sofa className="w-5 h-5" />} label="Decorate" />
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl voxel-shadow p-5 flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none">
            {tab === "feed" && (
              <div>
                <h3 className="font-fredoka text-xl font-bold mb-3 flex items-center gap-2">
                  <Apple className="w-5 h-5 text-[#FF9B54]" /> Snack time
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {foods.map((f) => {
                    const can = pet.gems >= f.gemPrice;
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleFeed(f)}
                        disabled={!can}
                        className={`p-4 rounded-2xl voxel-shadow text-left transition-all hover:-translate-y-0.5 ${can ? "bg-[#FFE5B4] hover:bg-[#FFD89A]" : "bg-gray-100 opacity-60 cursor-not-allowed"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#FF9B54]">{getFoodIcon(f.name)}</span>
                          <span className="flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-full text-sm font-fredoka font-bold">
                            <Gem className="w-3 h-3 text-[#84DCC6] fill-[#A5FFD6]" />
                            {f.gemPrice}
                          </span>
                        </div>
                        <p className="font-fredoka font-bold leading-tight mb-1">{f.name}</p>
                        <p className="text-xs text-gray-600">
                          +{f.fullnessBoost} full · +{f.happinessBoost} happy
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "dress" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="font-fredoka text-lg font-bold mb-2 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#FF9B54]" /> Hats
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={unequipHat}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all ${
                        !pet.equippedHat ? "bg-[#A5FFD6] voxel-shadow ring-2 ring-[#2D3142]" : "bg-white voxel-shadow hover:-translate-y-0.5 hover:bg-[#FFE5B4]/60"
                      }`}
                    >
                      <span className="text-3xl mb-1">🚫</span>
                      <span className="font-fredoka text-[10px] font-bold text-center leading-tight">No Hat</span>
                      {!pet.equippedHat && (
                        <span className="absolute top-1 right-1 bg-[#2D3142] text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                    {hats.map(h => (
                      <ShopItemButton key={h.id} item={h} gems={pet.gems} selected={pet.equippedHat === h.id} onPick={() => tryBuyOrEquip(h, "hat")} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-fredoka text-lg font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#B4A0E5]" /> Glow color
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map(c => (
                      <ShopItemButton key={c.id} item={c} gems={pet.gems} selected={pet.glowColor === c.id} onPick={() => tryBuyOrEquip(c, "color")} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "decorate" && (
              <div>
                <h3 className="font-fredoka text-lg font-bold mb-2 flex items-center gap-2">
                  <Sofa className="w-5 h-5 text-[#84DCC6]" /> Den stuff
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {decors.map(d => (
                    <ShopItemButton key={d.id} item={d} gems={pet.gems} selected={pet.decor.includes(d.id)} onPick={() => tryBuyOrEquip(d, "decor")} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 font-fredoka">
                  Tap to add or remove from your den.
                </p>
              </div>
            )}
          </div>

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

function Meter({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 voxel-shadow">
      {icon}
      <span className="font-fredoka text-xs font-bold w-20">{label}</span>
      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-fredoka text-xs font-bold tabular-nums w-8 text-right">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-3 rounded-xl font-fredoka font-bold flex items-center justify-center gap-1.5 transition-colors text-sm md:text-base ${
        active ? "bg-[#FF9B54] text-white voxel-shadow" : "text-[#2D3142] hover:bg-white/60"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ShopItemButton({ item, gems, selected, onPick }: { item: ShopItem, gems: number, selected: boolean, onPick: () => void }) {
  const canAfford = gems >= item.gemPrice;
  const disabled = item.locked || (!item.owned && !canAfford);

  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all ${
        selected
          ? "bg-[#A5FFD6] voxel-shadow ring-2 ring-[#2D3142]"
          : item.owned
          ? "bg-[#FFE5B4] voxel-shadow hover:-translate-y-0.5"
          : item.locked
          ? "bg-gray-100 opacity-70 cursor-not-allowed"
          : canAfford
          ? "bg-white voxel-shadow hover:-translate-y-0.5 hover:bg-[#FFE5B4]/60"
          : "bg-gray-100 opacity-60 cursor-not-allowed"
      }`}
      title={item.locked ? item.lockHint ?? "" : item.name}
    >
      <span className="text-3xl mb-1" style={{ filter: "drop-shadow(1px 2px 0 rgba(0,0,0,0.15))" }}>
        {item.emoji}
      </span>
      <span className="font-fredoka text-[10px] font-bold text-center leading-tight">
        {item.name}
      </span>

      {item.locked ? (
        <span className="absolute top-1 right-1 bg-gray-700 text-white rounded-full p-1">
          <Lock className="w-3 h-3" />
        </span>
      ) : selected ? (
        <span className="absolute top-1 right-1 bg-[#2D3142] text-white rounded-full p-1">
          <Check className="w-3 h-3" />
        </span>
      ) : item.owned ? (
        <span className="absolute top-1 right-1 bg-white/90 rounded-full px-1.5 text-[9px] font-fredoka font-bold text-gray-600">
          owned
        </span>
      ) : (
        <span className="absolute top-1 right-1 bg-white/90 rounded-full px-1.5 py-0.5 text-[10px] font-fredoka font-bold flex items-center gap-0.5">
          <Gem className="w-2.5 h-2.5 text-[#84DCC6] fill-[#A5FFD6]" />
          {item.gemPrice}
        </span>
      )}
    </button>
  );
}
