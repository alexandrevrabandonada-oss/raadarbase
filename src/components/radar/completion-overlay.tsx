"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, Compass, PartyPopper, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CompletionType } from "@/hooks/use-completion";

const COMPLETION_CONFIG: Record<
  CompletionType,
  {
    title: string;
    description: string;
    quote: string;
    icon: React.ComponentType<{ className?: string }>;
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
    bgClass: "bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent",
    borderClass: "border-sky-500/35",
    particleColor: "#0ea5e9",
    glowClass: "shadow-[0_0_50px_-12px_rgba(14,165,233,0.3)]",
  },
};

export function CompletionOverlay({ type, onClose }: { type: CompletionType; onClose: () => void }) {
  const config = COMPLETION_CONFIG[type];
  const Icon = config.icon;
  const [particles] = React.useState(() =>
    Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      delay: `${Math.random() * 1.5}s`,
      size: `${6 + Math.random() * 12}px`,
    })),
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-4 select-none">
      <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md transition-opacity duration-500 animate-in fade-in" onClick={onClose} />

      <div className="pointer-events-none absolute inset-0">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute bottom-0 rounded-full opacity-0 animate-[float-up_3s_ease-out_forwards]"
            style={{
              left: particle.left,
              width: particle.size,
              height: particle.size,
              backgroundColor: config.particleColor,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-[32px] border bg-[#fffcf7] p-8 text-center shadow-2xl transition-all duration-500 md:p-10",
          "animate-in zoom-in-95 slide-in-from-bottom-10",
          config.borderClass,
          config.glowClass,
          config.bgClass,
        )}
      >
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#0f1b24] text-white shadow-xl">
          <div className="absolute inset-0 animate-ping rounded-[24px] opacity-25" style={{ backgroundColor: config.particleColor }} />
          <div className="animate-bounce transition-transform duration-700">
            <Icon className="h-10 w-10 text-[#f0c15b]" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7759]">Missão Concluída</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">{config.title}</h2>
          </div>

          <p className="text-sm leading-relaxed font-medium text-zinc-600">{config.description}</p>

          <div className="mt-8 rounded-2xl border border-[#d8c7ac]/60 bg-white/70 p-5 italic">
            <p className="mb-2 text-[9px] font-black tracking-[0.2em] text-[#8b7759] uppercase not-italic">Dica Tática</p>
            <p className="text-sm leading-relaxed font-semibold text-zinc-700">&ldquo;{config.quote}&rdquo;</p>
          </div>

          <div className="pt-6">
            <Button
              className="h-13 w-full rounded-xl bg-[#0f1b24] text-xs font-black tracking-wider text-white uppercase shadow-md hover:bg-[#172733]"
              onClick={onClose}
            >
              Continuar Operação
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-[10px] font-medium text-zinc-400">Pressione ENTER, ESPAÇO ou clique fora para continuar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
