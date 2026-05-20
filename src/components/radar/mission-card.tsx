"use client";

import { ReactNode } from "react";
import { PriorityPerson } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JourneyBar } from "@/components/radar/journey-bar";
import {
  getPriorityPersonHoldState,
  getPriorityPersonHoldText,
  getPriorityPersonJourney,
  getPriorityPersonMissionNextStep,
  getPriorityPersonMissionPhaseLabel,
  getPriorityPersonMissionReason,
  getPriorityPersonMissionTypeLabel,
} from "@/lib/missions/priority-person-mission-adapter";

type MissionCardProps = {
  person: PriorityPerson;
  primaryActionLabel?: string;
  onPrimaryAction?: (person: PriorityPerson) => void;
  footer?: ReactNode;
  className?: string;
  stencilNumber?: string;
};

function getTemperatureTone(temperature: PriorityPerson["temperature"]) {
  return {
    quente: "border-rust bg-rust/15 text-rust",
    morno: "border-burnt-yellow bg-burnt-yellow/10 text-dark-yellow",
    frio: "border-cement bg-cement/15 text-cement",
  }[temperature];
}

export function MissionCard({
  person,
  primaryActionLabel = "Abrir missão",
  onPrimaryAction,
  footer,
  className,
  stencilNumber,
}: MissionCardProps) {
  const journey = getPriorityPersonJourney(person);
  const phaseLabel = getPriorityPersonMissionPhaseLabel(person);
  const holdState = getPriorityPersonHoldState(person);
  const holdText = getPriorityPersonHoldText(person);
  const missionTypeLabel = getPriorityPersonMissionTypeLabel(person);
  const missionReason = getPriorityPersonMissionReason(person);
  const missionNextStep = getPriorityPersonMissionNextStep(person);
  const initials = (person.displayName ?? person.username).slice(0, 2).toUpperCase();

  return (
    <Card className={cn("bloco-concreto h-full overflow-hidden py-0", className)}>
      {/* Stencil spray-painted number background decor */}
      {stencilNumber && (
        <div className="absolute right-4 top-1 select-none pointer-events-none font-mono text-[6.5rem] font-black text-charcoal/[0.05] leading-none tracking-tighter">
          {stencilNumber}
        </div>
      )}
      <CardContent className="flex h-full flex-col gap-4 p-5 relative z-10">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {/* Brutalist stencil avatar box */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] border-2 border-black bg-charcoal text-base font-black text-burnt-yellow shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
              {initials}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <p
                  className="max-w-[200px] truncate text-base font-black tracking-tight text-charcoal"
                  title={`@${person.username}`}
                >
                  @{person.username}
                </p>
                {missionTypeLabel ? (
                  <Badge variant="outline" className="rounded-[2px] border-black bg-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-charcoal">
                    {missionTypeLabel}
                  </Badge>
                ) : null}
                <Badge variant="outline" className={cn("rounded-[2px] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider", getTemperatureTone(person.temperature))}>
                  {person.temperature === "frio" ? "Observação" : person.temperature}
                </Badge>
              </div>
              <p className="line-clamp-1 text-xs text-cement font-bold">
                {person.displayName ?? "Pessoa monitorada"} · {person.latestInteractionLabel}
              </p>
            </div>
          </div>
          
          {/* Brutalist Phase indicator panel */}
          <div className="rounded-[2px] border-2 border-black bg-white px-3 py-1.5 xl:min-w-[140px] xl:text-right shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cement leading-none">Fase atual</p>
            <p className="mt-1 text-sm font-black text-charcoal leading-none">{phaseLabel}</p>
          </div>
        </div>

        <div className="grid gap-2">
          {/* Description panels with square corners and solid border */}
          <div className="space-y-1 rounded-[2px] border-2 border-black bg-white/70 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cement">Motivo (Por que)</p>
            <p className="line-clamp-2 text-xs font-medium leading-relaxed text-charcoal" title={missionReason}>{missionReason}</p>
          </div>
          
          <div className="space-y-1 rounded-[2px] border-2 border-black bg-burnt-yellow/10 p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#A67300]">Próxima ação recomendada</p>
            <p className="line-clamp-2 text-xs font-black leading-relaxed text-charcoal" title={missionNextStep}>{missionNextStep}</p>
          </div>
          
          <div
            className={cn(
              "space-y-1 rounded-[2px] border-2 p-3 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]",
              holdState === "blocked"
                ? "border-rust bg-rust/10 text-rust"
                : holdState === "waiting"
                  ? "border-dark-yellow bg-burnt-yellow/15 text-dark-yellow"
                  : "border-moss bg-moss/10 text-moss",
            )}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em] leading-none">
              {holdState === "free" ? "Caminho livre" : holdState === "waiting" ? "Em espera" : "Bloqueio ativo"}
            </p>
            <p className="line-clamp-2 text-xs leading-relaxed font-bold" title={holdText}>
              {holdText}
            </p>
          </div>
        </div>

        <div className="rounded-[2px] border-2 border-black bg-white p-2">
          <JourneyBar {...journey} compact />
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[9px] font-black uppercase tracking-wider text-cement">
            Progresso da jornada
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-9 px-4 rounded-[2px] text-[10px]"
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
