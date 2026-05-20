"use client";

import * as React from "react";
import { CheckCircle2, ShieldCheck, Sparkles, PartyPopper, Compass, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompletionType, CompletionContext } from "@/hooks/use-completion";
import { Button } from "@/components/ui/button";

export function useCompletionContext() {
  const context = React.useContext(CompletionContext);
  if (!context) {
    throw new Error("useCompletionContext must be used within a CompletionProvider");
  }
  return context;
}

const COMPLETION_CONFIG: Record<
  CompletionType,
  {
    title: string;
    description: string;
    quote: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgClass: string;
    borderClass: string;
    particleColor: string;
    glowClass: string;
  }
> = {
  response_recorded: {
    title: "Vínculo Registrado",
    description: "A resposta foi documentada e a história de contato avançou com segurança.",
    quote: "Cada escuta é um tijolo na construção de uma base real e duradoura nos bairros.",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgClass: "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent",
    borderClass: "border-emerald-500/35",
    particleColor: "#10b981",
    glowClass: "shadow-[0_0_50px_-12px_rgba(16,185,129,0.25)]",
  },
  referral_done: {
    title: "Encaminhamento Concluído",
    description: "Ninguém fica perdido. O cidadão agora tem um rumo e um próximo passo claro.",
    quote: "Avançamos da conversa digital para a organização de apoio presencial.",
    icon: Compass,
    color: "text-indigo-500",
    bgClass: "bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent",
    borderClass: "border-indigo-500/35",
    particleColor: "#6366f1",
    glowClass: "shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)]",
  },
  dnc_respected: {
    title: "Privacidade Assegurada",
    description: "O pedido de não contato foi acatado. Nossa base se apoia no respeito integral.",
    quote: "Uma campanha ética sabe escutar o sim, mas respeita absolutamente o não.",
    icon: ShieldCheck,
    color: "text-zinc-500",
    bgClass: "bg-gradient-to-br from-zinc-500/10 via-zinc-500/5 to-transparent",
    borderClass: "border-zinc-500/35",
    particleColor: "#71717a",
    glowClass: "shadow-[0_0_50px_-12px_rgba(113,113,122,0.2)]",
  },
  day_closed: {
    title: "Ciclo do Dia Encerrado",
    description: "Tarefas concluídas e fila zerada de forma saudável. Ótimo trabalho!",
    quote: "A constância coletiva vence qualquer correria de última hora. Descanse agora.",
    icon: PartyPopper,
    color: "text-amber-500",
    bgClass: "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent",
    borderClass: "border-amber-500/35",
    particleColor: "#f59e0b",
    glowClass: "shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)]",
  },
  event_closed: {
    title: "Módulo de Campo Finalizado",
    description: "Resultados da ação territorial integrados com sucesso à inteligência central.",
    quote: "A força das ruas ganha inteligência quando sistematizada e respeitada de volta.",
    icon: PartyPopper,
    color: "text-amber-500",
    bgClass: "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent",
    borderClass: "border-amber-500/35",
    particleColor: "#f59e0b",
    glowClass: "shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)]",
  },
  training_phase_done: {
    title: "Fase Dominada",
    description: "Você avançou nos treinamentos táticos e dominou mais um processo operacional.",
    quote: "Operar com método protege a integridade e acelera o resultado do grupo.",
    icon: Sparkles,
    color: "text-sky-500",
    bgClass: "bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent",
    borderClass: "border-sky-500/35",
    particleColor: "#0ea5e9",
    glowClass: "shadow-[0_0_50px_-12px_rgba(14,165,233,0.25)]",
  },
  training_finished: {
    title: "Operador Capacitado",
    description: "Treinamento finalizado. A base de simulação foi concluída com mérito.",
    quote: "Pronto para campo real. Leve a ética e o cuidado com a base para cada contato.",
    icon: Sparkles,
    color: "text-sky-500",
    bgClass: "bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent",
    borderClass: "border-sky-500/35",
    particleColor: "#0ea5e9",
    glowClass: "shadow-[0_0_50px_-12px_rgba(14,165,233,0.3)]",
  },
};

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
  const [particles, setParticles] = React.useState<Array<{ id: number; left: string; delay: string; size: string }>>([]);

  const showCompletion = React.useCallback((type: CompletionType) => {
    setActiveCompletion(type);
    playProceduralSound(type);

    // Gerar posições aleatórias para as partículas flutuantes
    const generatedParticles = Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      delay: `${Math.random() * 1.5}s`,
      size: `${6 + Math.random() * 12}px`,
    }));
    setParticles(generatedParticles);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeCompletion && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
        e.preventDefault();
        closeCompletion();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCompletion, closeCompletion]);

  const config = activeCompletion ? COMPLETION_CONFIG[activeCompletion] : null;
  const Icon = config ? config.icon : null;

  return (
    <CompletionContext.Provider value={{ showCompletion, activeCompletion, closeCompletion }}>
      {children}

      {/* Screen Overlay de Celebração Gamificada */}
      {activeCompletion && config && Icon && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden select-none">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md transition-opacity duration-500 animate-in fade-in"
            onClick={closeCompletion}
          />

          {/* Efeito de Partículas Flutuantes de Fundo */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute bottom-0 rounded-full opacity-0 animate-[float-up_3s_ease-out_forwards]"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: config.particleColor,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </div>

          {/* Cartão de Celebração Central */}
          <div 
            className={cn(
              "relative w-full max-w-lg overflow-hidden rounded-[32px] border bg-[#fffcf7] p-8 md:p-10",
              "text-center transition-all duration-500 shadow-2xl",
              "animate-in zoom-in-95 slide-in-from-bottom-10",
              config.borderClass,
              config.glowClass,
              config.bgClass
            )}
          >
            {/* Ícone de Conquista com Animações */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#0f1b24] text-white shadow-xl relative group">
              <div 
                className="absolute inset-0 rounded-[24px] opacity-25 animate-ping"
                style={{ backgroundColor: config.particleColor }}
              />
              <div className={cn("transition-transform duration-700 animate-bounce")}>
                <Icon className="h-10 w-10 text-[#f0c15b]" />
              </div>
            </div>

            {/* Títulos e Detalhes da Missão */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Missão Concluída</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
                  {config.title}
                </h2>
              </div>
              
              <p className="text-sm font-medium leading-relaxed text-zinc-600">
                {config.description}
              </p>

              {/* Dica Tática/Lógica */}
              <div className="mt-8 rounded-2xl border border-[#d8c7ac]/60 bg-white/70 p-5 italic">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b7759] not-italic mb-2">Dica Tática</p>
                <p className="text-sm font-semibold leading-relaxed text-zinc-700">
                  &ldquo;{config.quote}&rdquo;
                </p>
              </div>

              {/* Botão de Fechamento */}
              <div className="pt-6">
                <Button
                  className="h-13 w-full rounded-xl bg-[#0f1b24] text-xs font-black uppercase tracking-wider text-white hover:bg-[#172733] shadow-md"
                  onClick={closeCompletion}
                >
                  Continuar Operação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="mt-3 text-[10px] font-medium text-zinc-400">
                  Pressione ENTER, ESPAÇO ou clique fora para continuar
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </CompletionContext.Provider>
  );
}
