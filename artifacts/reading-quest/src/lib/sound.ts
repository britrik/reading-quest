/**
 * Tiny WebAudio helper for celebratory sound effects.
 * No audio assets — synthesised on the fly so it works offline + has no
 * download cost. All calls are guarded by the user's `soundEnabled`
 * preference; pass `enabled=false` to make every call a no-op.
 */
let cachedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!cachedCtx) cachedCtx = new Ctor();
  return cachedCtx;
}

function tone(ctx: AudioContext, freq: number, durationMs: number, startOffsetMs = 0, gain = 0.08): void {
  const t0 = ctx.currentTime + startOffsetMs / 1000;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.05);
}

export function playChapterFinish(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  // C major arpeggio: C5, E5, G5
  tone(ctx, 523.25, 220, 0);
  tone(ctx, 659.25, 220, 120);
  tone(ctx, 783.99, 320, 240);
}

export function playGemEarn(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Quick two-tone chime
  tone(ctx, 880, 110, 0, 0.06);
  tone(ctx, 1318.5, 160, 80, 0.06);
}

export function playUnlock(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Rising sweep
  tone(ctx, 440, 120, 0, 0.05);
  tone(ctx, 554.37, 120, 100, 0.05);
  tone(ctx, 659.25, 200, 200, 0.06);
}
