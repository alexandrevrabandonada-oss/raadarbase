"use client";

export class CampfireAudio {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private rumbleSource: AudioBufferSourceNode | null = null;
  private crackleInterval: NodeJS.Timeout | null = null;
  private gainNode: GainNode | null = null;

  constructor() {}

  start() {
    if (this.isRunning) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      this.ctx = ctx;
      const now = ctx.currentTime;

      // Master gain
      const gainNode = ctx.createGain();
      this.gainNode = gainNode;
      const isMuted = localStorage.getItem("radar_audio_muted") === "true";
      gainNode.gain.setValueAtTime(isMuted ? 0 : 0.35, now);
      gainNode.connect(ctx.destination);

      // Create brown noise buffer for the fire rumble
      const sampleRate = ctx.sampleRate;
      const bufferSize = 2 * sampleRate;
      const brownNoiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const output = brownNoiseBuffer.getChannelData(0);
      
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter: integration of white noise
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // compensation volume
      }

      // Play rumble
      const rumbleSource = ctx.createBufferSource();
      this.rumbleSource = rumbleSource;
      rumbleSource.buffer = brownNoiseBuffer;
      rumbleSource.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, now);

      rumbleSource.connect(filter);
      filter.connect(gainNode);
      rumbleSource.start(0);

      // Crackle click generator function
      const playSpark = () => {
        if (!this.ctx || this.ctx.state === "closed" || !this.gainNode) return;
        const sparkTime = this.ctx.currentTime;
        
        const sparkOsc = this.ctx.createOscillator();
        const sparkGain = this.ctx.createGain();
        
        // Wood pop frequency signature
        sparkOsc.type = "triangle";
        const freq = 1500 + Math.random() * 2200;
        sparkOsc.frequency.setValueAtTime(freq, sparkTime);
        
        // Very sharp click decay
        const duration = 0.004 + Math.random() * 0.012;
        sparkGain.gain.setValueAtTime(0.0, sparkTime);
        sparkGain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.12, sparkTime + 0.001);
        sparkGain.gain.exponentialRampToValueAtTime(0.0001, sparkTime + duration);
        
        // Bandpass to focus wood popping frequency
        const bp = this.ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(freq, sparkTime);
        bp.Q.setValueAtTime(3.0, sparkTime);

        sparkOsc.connect(bp);
        bp.connect(sparkGain);
        sparkGain.connect(this.gainNode);
        
        sparkOsc.start(sparkTime);
        sparkOsc.stop(sparkTime + duration + 0.01);
      };

      // Periodic trigger for clicks
      this.crackleInterval = setInterval(() => {
        if (Math.random() > 0.25) {
          playSpark();
        }
        if (Math.random() > 0.82) {
          // Double crackle delay
          setTimeout(() => playSpark(), 60 + Math.random() * 100);
        }
      }, 180);

      this.isRunning = true;
    } catch (e) {
      console.warn("Failed to initialize campfire audio", e);
    }
  }

  setMuted(muted: boolean) {
    if (this.gainNode && this.ctx) {
      const targetVolume = muted ? 0.0 : 0.35;
      this.gainNode.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + 0.15);
    }
  }

  stop() {
    if (!this.isRunning) return;
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
    try {
      if (this.rumbleSource) {
        this.rumbleSource.stop();
        this.rumbleSource = null;
      }
    } catch {
      // already stopped
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isRunning = false;
  }
}
