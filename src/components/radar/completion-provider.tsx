"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { CompletionType, CompletionContext } from "@/hooks/use-completion";

const CompletionOverlay = dynamic(
  () => import("./completion-overlay").then((module) => module.CompletionOverlay),
  { ssr: false },
);

export function useCompletionContext() {
  const context = React.useContext(CompletionContext);
  if (!context) {
    throw new Error("useCompletionContext must be used within a CompletionProvider");
  }
  return context;
}

// Procedural sound synthesizer using Web Audio API
function playProceduralSound(type: CompletionType) {
  try {
    if (typeof window !== "undefined") {
      const isMuted = localStorage.getItem("radar_audio_muted") === "true";
      if (isMuted) return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, duration: number, startTime: number, oscType: OscillatorType = "sine") => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0.08, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    if (type === "response_recorded") {
      // Arpeggio ascendente suave (D4 -> F#4 -> A4)
      playTone(293.66, 0.12, now, "triangle"); // D4
      playTone(369.99, 0.12, now + 0.08, "triangle"); // F#4
      playTone(440.00, 0.3, now + 0.16, "sine"); // A4
    } else if (type === "referral_done") {
      // Tom duplo brilhante (C5 -> E5)
      playTone(523.25, 0.1, now, "sine"); // C5
      playTone(659.25, 0.35, now + 0.06, "sine"); // E5
    } else if (type === "dnc_respected") {
      // Dual tone protetivo e descendente (A4 -> E4)
      playTone(440.00, 0.15, now, "sine"); // A4
      playTone(329.63, 0.3, now + 0.1, "sine"); // E4
    } else if (type === "day_closed" || type === "event_closed") {
      // Fanfarra triunfal rápida (G4 -> C5 -> E5 -> G5)
      playTone(392.00, 0.08, now, "triangle"); // G4
      playTone(523.25, 0.08, now + 0.08, "triangle"); // C5
      playTone(659.25, 0.08, now + 0.16, "triangle"); // E5
      playTone(783.99, 0.4, now + 0.24, "sine"); // G5
    } else if (type === "training_phase_done") {
      // Ding brilhante duplo (E5 -> A5)
      playTone(659.25, 0.08, now, "sine");
      playTone(880.00, 0.3, now + 0.06, "sine");
    } else if (type === "training_finished") {
      // Sucesso total RPG (C5 -> G5 -> C6 -> E6)
      playTone(523.25, 0.06, now, "triangle");
      playTone(783.99, 0.06, now + 0.06, "triangle");
      playTone(1046.50, 0.06, now + 0.12, "triangle");
      playTone(1318.51, 0.45, now + 0.18, "sine");
    }
  } catch (e) {
    console.warn("AudioContext failed to start:", e);
  }
}

export function CompletionProvider({ children }: { children: React.ReactNode }) {
  const [activeCompletion, setActiveCompletion] = React.useState<CompletionType | null>(null);

  const showCompletion = React.useCallback((type: CompletionType) => {
    setActiveCompletion(type);
    playProceduralSound(type);
  }, []);

  const closeCompletion = React.useCallback(() => {
    setActiveCompletion(null);
  }, []);

  // Fechar automaticamente após 6 segundos se o usuário não interagir
  React.useEffect(() => {
    if (activeCompletion) {
      const timer = setTimeout(() => {
        closeCompletion();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeCompletion, closeCompletion]);

  // Permitir fechar ao pressionar Enter ou Space
  React.useEffect(() => {
    if (!activeCompletion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        closeCompletion();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCompletion, closeCompletion]);

  return (
    <CompletionContext.Provider value={{ showCompletion, activeCompletion, closeCompletion }}>
      {children}

      {activeCompletion ? <CompletionOverlay type={activeCompletion} onClose={closeCompletion} /> : null}
    </CompletionContext.Provider>
  );
}
