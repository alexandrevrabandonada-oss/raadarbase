"use client";

import { ReactNode } from "react";
import { PriorityPerson } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyBar } from "@/components/radar/journey-bar";

type MissionCardProps = {
  person: PriorityPerson;
  primaryActionLabel?: string;
  onPrimaryAction?: (person: PriorityPerson) => void;
  footer?: ReactNode;
  className?: string;
};

function getHoldState(person: PriorityPerson): "blocked" | "waiting" | "free" {
  if (person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact) {
    return "blocked";
  }
  if (person.riskFlags?.recentOutreach) {
    return "waiting";
  }
  if (person.isPendingResponse) {
    return "waiting";
  }
  return "free";
}

function getHoldText(person: PriorityPerson, state: "blocked" | "waiting" | "free") {
  if (state === "blocked") {
    return person.doNotContactReason || "Missão bloqueada por cuidado ético.";
  }
  if (person.riskFlags?.recentOutreach) {
    return "Contato recente. Aguarde a janela ética antes de insistir.";
  }
  if (person.isPendingResponse) {
    return "Conversa aberta. Registrar retorno quando houver resposta.";
  }
  return "Sem bloqueio ativo agora.";
}

function getTemperatureTone(temperature: PriorityPerson["temperature"]) {
  return {
    quente: "border-rose-200 bg-rose-50 text-rose-700",
    morno: "border-amber-200 bg-amber-50 text-amber-700",
    frio: "border-sky-200 bg-sky-50 text-sky-700",
  }[temperature];
}

export function MissionCard({
  person,
  primaryActionLabel = "Abrir missão",
  onPrimaryAction,
  footer,
  className,
}: MissionCardProps) {
  const journey = mapPersonToJourney(
    person.status,
    person.hasPendingTask,
    person.hasReferral,
    person.lastInteractionAt,
  );
  const phaseLabelMap = {
    preparar: "Preparar",
    conversar: "Conversar",
    registrar: "Registrar",
    encaminhar: "Encaminhar",
    concluir: "Concluir",
  } as const;
  const phaseLabel = journey.isBlocked ? "Em espera" : phaseLabelMap[journey.currentPhase];
  const holdState = getHoldState(person);
  const holdText = getHoldText(person, holdState);
  const initials = (person.displayName ?? person.username).slice(0, 2).toUpperCase();

  return (
    <Card className={cn("radar-outline-card h-full overflow-hidden border-[#d8c7ac] bg-[linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,236,223,0.92))] py-0 shadow-[0_16px_44px_rgba(15,23,42,0.06)]", className)}>
      <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d39b2a]/25 bg-[#0f1b24] text-lg font-black text-[#f1c15a] shadow-lg">
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p
                  className="max-w-[220px] truncate text-lg font-black tracking-tight text-zinc-950 sm:max-w-[280px]"
                  title={`@${person.username}`}
                >
                  @{person.username}
                </p>
                <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em]", getTemperatureTone(person.temperature))}>
                  {person.temperature === "frio" ? "Observação" : person.temperature}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm leading-5 text-zinc-500">
                {person.displayName ?? "Pessoa monitorada"} · {person.latestInteractionLabel}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] px-4 py-3 xl:min-w-[168px] xl:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7759]">Fase atual</p>
            <p className="mt-1 text-base font-black text-[#11202a]">{phaseLabel}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="space-y-2 rounded-2xl border border-[#d8c7ac] bg-white/75 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8b7759]">Por que</p>
            <p className="line-clamp-3 text-sm font-medium leading-6 text-zinc-800" title={person.priorityReason}>{person.priorityReason}</p>
          </div>
          <div className="space-y-2 rounded-2xl border border-[#d8c7ac] bg-[rgba(17,32,42,0.04)] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8b7759]">Próxima ação</p>
            <p className="line-clamp-3 text-sm font-black leading-6 text-zinc-950" title={person.nextAction}>{person.nextAction}</p>
          </div>
          <div
            className={cn(
              "space-y-2 rounded-2xl border p-4",
              holdState === "blocked"
                ? "border-rose-200 bg-rose-50/70"
                : holdState === "waiting"
                  ? "border-amber-200 bg-amber-50/70"
                  : "border-emerald-200 bg-emerald-50/60",
            )}
          >
            <p
              className={cn(
                "text-[11px] font-black uppercase tracking-[0.18em]",
                holdState === "blocked"
                  ? "text-rose-700"
                  : holdState === "waiting"
                    ? "text-amber-700"
                    : "text-emerald-700",
              )}
            >
              {holdState === "free" ? "Caminho livre" : "Bloqueio ou espera"}
            </p>
            <p
              className={cn(
                "line-clamp-3 text-sm leading-6",
                holdState === "blocked"
                  ? "font-semibold text-rose-900"
                  : holdState === "waiting"
                    ? "font-semibold text-amber-900"
                    : "font-medium text-emerald-900",
              )}
              title={holdText}
            >
              {holdText}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#d8c7ac] bg-white/85 p-3">
          <JourneyBar {...journey} compact />
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Progresso da jornada visível
          </div>
          <Button
            className="h-11 rounded-xl bg-[#0f1b24] px-5 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#172733]"
            onClick={() => onPrimaryAction?.(person)}
          >
            {primaryActionLabel}
          </Button>
        </div>

        {footer}
      </CardContent>
    </Card>
  );
}
