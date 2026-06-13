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
  if (cachedCtx.state === "suspended") void cachedCtx.resume();
  return cachedCtx;
}

function tone(ctx: AudioContext, freq: number, durationMs: number, startOffsetMs = 0, gain = 0.08, type: OscillatorType = "sine"): void {
  const t0 = ctx.currentTime + startOffsetMs / 1000;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
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
  // C major arpeggio: C5, E5, G5, C6
  tone(ctx, 523.25, 220, 0);
  tone(ctx, 659.25, 220, 120);
  tone(ctx, 783.99, 220, 240);
  tone(ctx, 1046.5, 400, 360, 0.1);
}

export function playGemEarn(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, 880, 110, 0, 0.06);
  tone(ctx, 1318.5, 160, 80, 0.06);
}

export function playHatEquip(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, 392, 90, 0, 0.05);
  tone(ctx, 587.33, 140, 60, 0.05);
}

export function playUnlock(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, 440, 120, 0, 0.05);
  tone(ctx, 554.37, 120, 100, 0.05);
  tone(ctx, 659.25, 200, 200, 0.06);
}

/** Short pentatonic pluck — plays instantly when a word is tapped. */
export function playWordTap(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Pentatonic: pick a note based on current time for variety
  const notes = [523.25, 587.33, 659.25, 783.99, 880];
  const note = notes[Math.floor(ctx.currentTime * 7) % notes.length]!;
  tone(ctx, note, 180, 0, 0.05, "triangle");
}

/** Soft whoosh for page/chapter navigation. */
export function playPageTurn(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, 440, 100, 0, 0.04);
  tone(ctx, 660, 140, 60, 0.04);
}

/** Happy chirp when the companion is poked. */
export function playCompanionPoke(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, 880, 80, 0, 0.06);
  tone(ctx, 1108.7, 100, 60, 0.06);
  tone(ctx, 1318.5, 120, 140, 0.05);
}

/** Big fanfare for celebration overlay. */
export function playCelebration(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  // C major scale + top
  const melody = [523.25, 659.25, 783.99, 1046.5];
  melody.forEach((freq, i) => tone(ctx, freq, 280, i * 130, 0.09));
  // Harmony
  tone(ctx, 392, 500, 200, 0.04);
  tone(ctx, 523.25, 500, 460, 0.06);
}
