import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Heart, Sparkles, ArrowRight } from "lucide-react";
import { useGetMe, useListWorlds } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getActiveProfileId } from "@/lib/profile";
import { markOnboarded } from "@/lib/profilesApi";

const COMPANIONS = [
  { id: "fox", name: "Foxie", emoji: "🦊" },
  { id: "owl", name: "Hooty", emoji: "🦉" },
  { id: "bunny", name: "Hop", emoji: "🐰" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data: me } = useGetMe();
  const { data: worlds } = useListWorlds();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [pickedCompanion, setPickedCompanion] = useState<string | null>(null);
  const [pickedWorldId, setPickedWorldId] = useState<number | null>(null);

  // If a profile id isn't set, kick back to picker.
  useEffect(() => {
    if (!getActiveProfileId()) setLocation("/profiles");
  }, [setLocation]);

  async function finish(skip: boolean) {
    const id = getActiveProfileId();
    if (id !== null) {
      try {
        await markOnboarded(id, pickedCompanion);
      } catch {
        /* non-fatal */
      }
    }
    await queryClient.invalidateQueries();
    if (!skip && pickedWorldId !== null) {
      setLocation(`/world/${pickedWorldId}`);
    } else {
      setLocation("/");
    }
  }

  return (
    <div
      className="min-h-[100dvh] w-full bg-[#FFE5B4] flex flex-col items-center justify-center p-6 font-atkinson"
      data-testid="onboarding"
    >
      <div className="max-w-2xl w-full">
        <div
          className="flex items-center justify-center gap-2 mb-6"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of 3`}
        >
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              aria-hidden="true"
              className={`w-3 h-3 rounded-full ${s === step ? "bg-[#FF9B54]" : s < step ? "bg-[#FF9B54]/50" : "bg-white/70"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center" data-testid="onboarding-step-0">
            <Sparkles className="w-16 h-16 text-[#FF9B54] mx-auto mb-4" aria-hidden="true" />
            <h1 className="font-fredoka text-4xl font-bold mb-3">
              Hi {me?.name ?? "friend"}! Welcome to Reading Quest
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              No grades, no timer, no rush. Stories, a tiny pet, and lots of cozy.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                data-testid="onboarding-next"
                className="bg-[#FF9B54] text-white px-8 py-4 rounded-full font-fredoka text-xl voxel-shadow inline-flex items-center gap-2"
              >
                Let's go <ArrowRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => finish(true)}
                data-testid="onboarding-skip"
                className="text-gray-600 px-4 py-4 font-fredoka"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="text-center" data-testid="onboarding-step-1">
            <h1 className="font-fredoka text-3xl font-bold mb-2">Pick a buddy</h1>
            <p className="text-gray-700 mb-6">They'll cheer you on while you read.</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {COMPANIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPickedCompanion(c.id)}
                  aria-pressed={pickedCompanion === c.id}
                  data-testid={`companion-${c.id}`}
                  className={`bg-white rounded-3xl p-6 voxel-shadow ${pickedCompanion === c.id ? "ring-4 ring-[#FF9B54]" : ""}`}
                >
                  <div className="text-6xl mb-2" aria-hidden="true">{c.emoji}</div>
                  <div className="font-fredoka font-semibold">{c.name}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!pickedCompanion}
                data-testid="onboarding-next"
                className="bg-[#FF9B54] text-white px-8 py-4 rounded-full font-fredoka text-xl voxel-shadow disabled:opacity-50 inline-flex items-center gap-2"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => finish(true)} data-testid="onboarding-skip" className="text-gray-600 px-4 py-4 font-fredoka">
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center" data-testid="onboarding-step-2">
            <Heart className="w-12 h-12 text-[#FF9B54] mx-auto mb-2" aria-hidden="true" />
            <h1 className="font-fredoka text-3xl font-bold mb-2">Pick a world to start</h1>
            <p className="text-gray-700 mb-6">You can always pick a different one later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {worlds?.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setPickedWorldId(w.id)}
                  aria-pressed={pickedWorldId === w.id}
                  data-testid={`world-pick-${w.id}`}
                  className={`bg-white rounded-3xl p-5 voxel-shadow text-left ${pickedWorldId === w.id ? "ring-4 ring-[#FF9B54]" : ""}`}
                >
                  <div className="font-fredoka font-bold text-lg">{w.name}</div>
                  <div className="text-sm text-gray-600">{w.difficultyLabel}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => finish(false)}
                disabled={!pickedWorldId}
                data-testid="onboarding-finish"
                className="bg-[#FF9B54] text-white px-8 py-4 rounded-full font-fredoka text-xl voxel-shadow disabled:opacity-50"
              >
                Start reading
              </button>
              <button type="button" onClick={() => finish(true)} data-testid="onboarding-skip" className="text-gray-600 px-4 py-4 font-fredoka">
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
