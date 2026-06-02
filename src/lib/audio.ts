/**
 * Brutalist HUD Synth Audio Engine (Web Audio API)
 *
 * Synthesizes retro-arcade micro-signals directly in the browser.
 * Zero static audio files needed, keeping page loads light.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("radar_audio_muted") === "true";
}

/**
 * Short, crisp notification bip when something shifts or dialog opens.
 */
export function playSynthConfirm() {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.setValueAtTime(880.00, now + 0.06); // A5

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * Sparkling arpeggio when a contact message is successfully sent or confirmed.
 */
export function playSynthSuccess() {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

    gain.gain.setValueAtTime(0.03, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + idx * 0.05 + 0.12);
  });
}

/**
 * Sliding frequency down representing skipped mission or backing out.
 */
export function playSynthSkip() {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(392.00, now); // G4
  osc.frequency.linearRampToValueAtTime(261.63, now + 0.15); // C4

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * Beautiful, low-frequency healing chime (432Hz) with a slow, calming release.
 * Used for Zen days, streak combos, or general mindfulness reminders.
 */
export function playSynthZen() {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  // Base Sine Wave
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(432, now); // Healing frequency
  gain1.gain.setValueAtTime(0.06, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  // Harmony: Overtones (C5 sharp)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(540, now + 0.05);
  gain2.gain.setValueAtTime(0.03, now + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 1.2);
  osc2.start(now + 0.05);
  osc2.stop(now + 1.0);
}

/**
 * Quick, subtle click/pop simulating physical terminal keypress or typewriter.
 */
export function playSynthKeypress() {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Short click: high frequency descending extremely fast (30ms) with slight pitch randomizing
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200 + Math.random() * 200, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);

  gain.gain.setValueAtTime(0.008, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
}

/**
 * Copy feedback: ascending pitch sweep indicating successful clipboard action
 */
export function playCopySound() {
  if (isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.1); // A5

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}
