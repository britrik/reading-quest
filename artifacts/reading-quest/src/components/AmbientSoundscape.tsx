import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPreferences, type Soundscape } from "@/lib/preferences";
import { getActiveProfileId } from "@/lib/profile";

/**
 * Plays a quiet ambient soundscape (forest / rain / ocean) that loops while
 * the kid is in the app. Implementation uses pink-noise-ish synthesised
 * audio so we don't ship audio assets and so it works offline. The component
 * mounts once at the app root, watches the kid's preferences, and starts /
 * stops the loop based on `prefs.soundscape` and `prefs.soundEnabled`.
 *
 * If WebAudio is unavailable (SSR, very old browsers) it silently no-ops.
 */
export function AmbientSoundscape() {
  const { data: prefs } = useQuery({
    queryKey: ["preferences", getActiveProfileId()],
    queryFn: () => fetchPreferences(getActiveProfileId()),
    refetchInterval: 5000,
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ src: AudioBufferSourceNode; gain: GainNode } | null>(null);

  useEffect(() => {
    const desired: Soundscape = prefs?.soundscape ?? "none";
    const enabled = prefs?.soundEnabled ?? true;
    const target = enabled ? desired : "none";

    function stop() {
      if (nodesRef.current) {
        try {
          nodesRef.current.src.stop();
        } catch {
          /* already stopped */
        }
        nodesRef.current.src.disconnect();
        nodesRef.current.gain.disconnect();
        nodesRef.current = null;
      }
    }

    if (target === "none") {
      stop();
      return;
    }

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!ctxRef.current) ctxRef.current = new Ctor();
    const ctx = ctxRef.current;

    stop();

    // Build a 2-second noise loop coloured to suggest the chosen environment.
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Simple low-pass to soften — gives a "rain on tent" feel for rain,
      // a "wind through leaves" feel for forest, and a slow swell for ocean.
      const lp = (last + white) * 0.5;
      last = lp;
      let sample = lp;
      if (target === "ocean") {
        // Slow swell: amplitude-modulate by a 0.25Hz sine
        const t = i / ctx.sampleRate;
        sample *= 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t);
      } else if (target === "forest") {
        // Add a faint chirp envelope every ~0.5s
        const t = i / ctx.sampleRate;
        sample *= 0.6 + 0.4 * Math.sin(2 * Math.PI * 2 * t);
      }
      data[i] = sample * 0.05; // very quiet by default
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = ctx.createGain();
    // Fade-in to avoid a click on start.
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target === "ocean" ? 0.6 : 0.45, ctx.currentTime + 1);
    src.connect(gain).connect(ctx.destination);
    src.start();
    nodesRef.current = { src, gain };

    return stop;
  }, [prefs?.soundscape, prefs?.soundEnabled]);

  return null;
}
