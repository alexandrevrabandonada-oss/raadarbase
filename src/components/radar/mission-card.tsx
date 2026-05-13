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

function getHoldText(person: PriorityPerson) {
  if (person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact) {
    return person.doNotContactReason || "Missão bloqueada por cuidado ético.";
  }
  if (person.riskFlags?.recentOutreach) {
    return "Contato recente. Melhor aguardar a janela antes de insistir.";
  }
  if (person.isPendingResponse) {
    return "Conversa aberta. Registrar retorno quando houver resposta.";
  }
  return "Sem bloqueio ativo no momento.";
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
  const holdText = getHoldText(person);
  const initials = (person.displayName ?? person.username).slice(0, 2).toUpperCase();

  return (
    <Card className={cn("h-full overflow-hidden border-zinc-200 bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] py-0 shadow-[0_16px_44px_rgba(15,23,42,0.06)]", className)}>
      <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-lg font-black text-white shadow-lg">
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="max-w-[220px] truncate text-lg font-black tracking-tight text-zinc-950 sm:max-w-[280px]">@{person.username}</p>
                <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em]", getTemperatureTone(person.temperature))}>
                  {person.temperature === "frio" ? "Observação" : person.temperature}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm leading-5 text-zinc-500">
                {person.displayName ?? "Pessoa monitorada"} · {person.latestInteractionLabel}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 xl:min-w-[168px] xl:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">Fase atual</p>
            <p className="mt-1 text-base font-black text-indigo-950">{phaseLabel}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Motivo</p>
            <p className="text-sm font-medium leading-6 text-zinc-700">{person.priorityReason}</p>
          </div>
          <div className="space-y-2 rounded-2xl border border-zinc-300 bg-white p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Próxima ação</p>
            <p className="text-sm font-black leading-6 text-zinc-950">{person.nextAction}</p>
          </div>
          <div className={cn("space-y-2 rounded-2xl border p-4", holdText.includes("bloque") || holdText.includes("janela") ? "border-rose-200 bg-rose-50/70" : "border-zinc-200 bg-zinc-50/80")}>
            <p className={cn("text-[11px] font-black uppercase tracking-[0.18em]", holdText.includes("bloque") || holdText.includes("janela") ? "text-rose-700" : "text-zinc-500")}>Bloqueio ou espera</p>
            <p className={cn("text-sm leading-6", holdText.includes("bloque") || holdText.includes("janela") ? "font-semibold text-rose-900" : "font-medium text-zinc-700")}>{holdText}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-zinc-200 bg-white/90 p-4">
          <JourneyBar {...journey} compact />
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Progresso da jornada visível
          </div>
          <Button
            className="h-11 rounded-xl bg-zinc-950 px-5 text-xs font-black uppercase tracking-[0.18em] hover:bg-zinc-800"
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
