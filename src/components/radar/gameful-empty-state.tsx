"use client";

import Link from "next/link";
import { ReactNode } from "react";
import {
  AlertTriangle,
  Compass,
  Flag,
  LayoutGrid,
  LucideIcon,
  Map,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  TowerControl,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GamefulEmptyVariant = "base" | "journey" | "territory" | "field" | "rhythm" | "memory" | "ethics";

type GamefulEmptyStateProps = {
  title: string;
  description: string;
  nextActionLabel?: string;
  nextActionHref?: string;
  variant?: GamefulEmptyVariant;
  icon?: LucideIcon;
  compact?: boolean;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

const variantTone: Record<
  GamefulEmptyVariant,
  {
    Icon: LucideIcon;
    eyebrow: string;
    reason: string;
    nextStep: string;
    shell: string;
    orb: string;
    panel: string;
    iconWrap: string;
    iconColor: string;
  }
> = {
  base: {
    Icon: LayoutGrid,
    eyebrow: "Base em espera",
    reason: "Ainda não entrou sinal suficiente para abrir esta frente da operação.",
    nextStep: "Próximo passo: preparar a base.",
    shell: "border-zinc-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.98))]",
    orb: "bg-zinc-950/6",
    panel: "border-zinc-200 bg-white/88",
    iconWrap: "border-zinc-200 bg-zinc-950",
    iconColor: "text-white",
  },
  journey: {
    Icon: Compass,
    eyebrow: "Jornada em pausa",
    reason: "Nenhuma missão entrou na trilha imediata do operador.",
    nextStep: "Próximo passo: puxar a próxima missão da fila.",
    shell: "border-indigo-200 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,0.98))]",
    orb: "bg-indigo-500/10",
    panel: "border-indigo-100 bg-white/88",
    iconWrap: "border-indigo-200 bg-indigo-600",
    iconColor: "text-white",
  },
  territory: {
    Icon: Map,
    eyebrow: "Mapa sem sinais",
    reason: "Sem bairros declarados ou sem leitura territorial suficiente para desenhar o mapa.",
    nextStep: "Próximo passo: registrar bairro, revisar pessoas sem bairro ou abrir ação de campo.",
    shell: "border-amber-200 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(255,251,235,0.98))]",
    orb: "bg-amber-500/12",
    panel: "border-amber-100 bg-white/90",
    iconWrap: "border-amber-200 bg-amber-500",
    iconColor: "text-white",
  },
  field: {
    Icon: Flag,
    eyebrow: "Campo sem missão",
    reason: "Nenhuma ação territorial foi planejada ou ainda não há sinais para abrir campo.",
    nextStep: "Próximo passo: montar uma missão de campo ou revisar territórios quentes.",
    shell: "border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(240,253,250,0.98))]",
    orb: "bg-emerald-500/10",
    panel: "border-emerald-100 bg-white/90",
    iconWrap: "border-emerald-200 bg-emerald-600",
    iconColor: "text-white",
  },
  rhythm: {
    Icon: TowerControl,
    eyebrow: "Ciclo em dia",
    reason: "Não há travas relevantes neste bloco ou os indicadores ainda não receberam movimento suficiente.",
    nextStep: "Próximo passo: sustentar o ritmo e revisar a base antes de abrir novas frentes.",
    shell: "border-sky-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(240,249,255,0.98))]",
    orb: "bg-sky-500/10",
    panel: "border-sky-100 bg-white/90",
    iconWrap: "border-sky-200 bg-sky-600",
    iconColor: "text-white",
  },
  memory: {
    Icon: MessageSquareText,
    eyebrow: "Memória em branco",
    reason: "Ainda não há registros recentes suficientes para sustentar leitura coletiva aqui.",
    nextStep: "Próximo passo: registrar o que aconteceu e fechar o ciclo com contexto.",
    shell: "border-violet-200 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(250,245,255,0.98))]",
    orb: "bg-violet-500/10",
    panel: "border-violet-100 bg-white/90",
    iconWrap: "border-violet-200 bg-violet-600",
    iconColor: "text-white",
  },
  ethics: {
    Icon: ShieldCheck,
    eyebrow: "Guardrail ativo",
    reason: "Não há pendência ética crítica ou este espaço depende de revisão manual antes de mostrar algo.",
    nextStep: "Próximo passo: manter leitura agregada e abordagem humana.",
    shell: "border-rose-200 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(255,241,242,0.98))]",
    orb: "bg-rose-500/10",
    panel: "border-rose-100 bg-white/90",
    iconWrap: "border-rose-200 bg-rose-600",
    iconColor: "text-white",
  },
};

export function GamefulEmptyState({
  title,
  description,
  nextActionLabel,
  nextActionHref,
  variant = "base",
  icon,
  compact = false,
  primaryAction,
  secondaryAction,
  className,
}: GamefulEmptyStateProps) {
  const tone = variantTone[variant];
  const RenderIcon = icon ?? tone.Icon;

  return (
    <Card className={cn("overflow-hidden py-0 shadow-sm", tone.shell, className)}>
      <CardContent className={cn("relative p-5 sm:p-6", compact ? "space-y-4" : "space-y-5")}>
        <div className={cn("pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl", tone.orb)} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm", tone.iconWrap)}>
              <RenderIcon className={cn("h-5 w-5", tone.iconColor)} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{tone.eyebrow}</p>
              <h3 className={cn("tracking-tight text-zinc-950", compact ? "text-lg font-black" : "text-2xl font-black")}>{title}</h3>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>
            </div>
          </div>
          <div className={cn("rounded-2xl border px-3 py-2", tone.panel, compact ? "sm:max-w-[220px]" : "sm:max-w-[280px]")}>
            <div className="flex items-center gap-2 text-zinc-700">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em]">Leitura do estado</p>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-zinc-700">{tone.reason}</p>
          </div>
        </div>

        <div className={cn("grid gap-3", compact ? "sm:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]")}>
          <div className={cn("rounded-[22px] border p-4", tone.panel)}>
            <div className="flex items-center gap-2 text-zinc-700">
              <Target className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em]">O que fazer agora</p>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-zinc-700">
              {nextActionLabel ? `Próximo passo: ${nextActionLabel}.` : tone.nextStep}
            </p>
          </div>

          {(primaryAction || secondaryAction || nextActionHref) ? (
            <div className={cn("flex flex-wrap items-center gap-3 rounded-[22px] border p-4", tone.panel)}>
              {primaryAction ?? (nextActionHref && nextActionLabel ? (
                <Button className="h-11 rounded-xl bg-zinc-950 px-4 text-xs font-black uppercase tracking-[0.18em] hover:bg-zinc-800" nativeButton={false} render={<Link href={nextActionHref} />}>
                  {nextActionLabel}
                </Button>
              ) : null)}
              {secondaryAction}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export const gamefulEmptyIcons = {
  alerts: AlertTriangle,
  base: LayoutGrid,
  ethics: ShieldCheck,
  field: Flag,
  journey: Compass,
  memory: MessageSquareText,
  rhythm: TowerControl,
  territory: Map,
  volunteers: Users,
};
