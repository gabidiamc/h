// Web Audio API Synthesizer for Lazo Eterno Notifications
// Completely self-contained, no external MP3 dependencies, works offline

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Plays a warm, luxurious boutique chime when a new customer reservation or purchase is received.
 */
export function playOrderChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime + 0.05;
    // Boutique 4-tone ascending bell chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const noteTime = startTime + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sine wave with slight triangle overtone for rich crystal bell resonance
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      // Fast attack, natural acoustic decay
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.14, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.95);
    });
  } catch (err) {
    console.warn("Could not play order chime:", err);
  }
}
