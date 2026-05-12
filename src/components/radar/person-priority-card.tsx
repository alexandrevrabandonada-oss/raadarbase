"use client";

import { useTransition } from "react";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import { assumePersonResponsible } from "@/app/actions";
import { PersonScoreBadge } from "./person-score-badge";
import { ActionButtonGroup } from "./action-button-group";
import { OperationalAlert } from "./operational-alert";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyProgress } from "./journey-progress";

interface PersonPriorityCardProps {
  person: PriorityPerson;
  index?: number;
  layout?: "card" | "cards" | "list";
  onActionComplete?: () => void;
  onOpenDetails?: (person: PriorityPerson) => void;
  className?: string;
}

export function PersonPriorityCard({ person, index, layout = "card", onActionComplete, onOpenDetails, className }: PersonPriorityCardProps) {
  const [isPending, startTransition] = useTransition();

  const isList = layout === "list";
  const isCard = layout === "card" || layout === "cards";

  function handleAssume() {
    startTransition(async () => {
      await assumePersonResponsible(person.id);
      onActionComplete?.();
    });
  }

  const isBlocked = person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact;

  if (isList) {
    return (
      <div className={cn(
        "group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border transition-all hover:bg-zinc-50/50",
        person.temperature === "quente" ? "border-orange-100 bg-orange-50/10" : "border-zinc-100 bg-white",
        isBlocked ? "opacity-75 grayscale-[50%]" : "",
        className
      )}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {index !== undefined && (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 font-black text-xs shrink-0">
              {index + 1}
            </div>
          )}
          
          <div 
            className="space-y-0.5 min-w-0 flex-1 cursor-pointer"
            onClick={() => onOpenDetails?.(person)}
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-sm truncate" title={person.displayName || `@${person.username}`}>
                {person.displayName || `@${person.username}`}
              </span>
              <PersonScoreBadge 
                score={person.priorityScore} 
                temperature={person.temperature} 
                tooltipText={person.scoreTooltip}
                riskFlags={person.riskFlags}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {person.temperature === "quente" && <Flame className="h-3 w-3 text-orange-500 fill-orange-500 shrink-0" />}
              <span className="truncate">@{person.username}</span>
              <span>•</span>
              <span className="truncate">{person.mainTheme || "Geral"}</span>
            </div>
            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1">
              {person.priorityReason}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-0 border-zinc-100">
          <div className="hidden lg:flex flex-col items-end px-4 border-r border-zinc-100 min-w-28">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Status</span>
            <span className={cn("text-xs font-black truncate", isBlocked ? "text-rose-700" : "text-indigo-700")}>
              {isBlocked ? "NÃO ABORDAR" : (person.status.replace(/_/g, " ").toUpperCase())}
            </span>
          </div>

          <ActionButtonGroup 
            personId={person.id}
            instagramUsername={person.username}
            onAssume={handleAssume}
            isAssuming={isPending}
            canAssume={!person.responsibleId && !isBlocked}
          />
        </div>
      </div>
    );
  }

  // Card Layout
  return (
    <Card 
      className={cn(
        "relative group border-2 transition-all hover:shadow-xl flex flex-col h-full",
        person.temperature === "quente" ? "border-orange-200 hover:-translate-y-1" : "border-zinc-100",
        isBlocked ? "opacity-75 grayscale-[50%]" : "",
        className
      )}
    >
      {index !== undefined && (
        <div className={cn(
          "absolute -top-3 -left-3 h-8 w-8 rounded-full text-white flex items-center justify-center font-black text-sm shadow-lg z-10",
          person.temperature === "quente" ? "bg-orange-600" : "bg-black"
        )}>
          #{index + 1}
        </div>
      )}

      <CardHeader className="pb-2 pt-6 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div 
            className="space-y-0.5 min-w-0 cursor-pointer"
            onClick={() => onOpenDetails?.(person)}
          >
            <CardTitle className="text-base font-black truncate" title={person.displayName || `@${person.username}`}>
              {person.displayName || `@${person.username}`}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
              {person.temperature === "quente" && <Flame className="h-3 w-3 text-orange-500 fill-orange-500 shrink-0" />}
              <span className="truncate text-muted-foreground">@{person.username}</span>
            </div>
          </div>
          <PersonScoreBadge 
            score={person.priorityScore} 
            temperature={person.temperature} 
            tooltipText={person.scoreTooltip}
            riskFlags={person.riskFlags}
            className="shrink-0"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[9px] uppercase font-black bg-zinc-50 border-zinc-200">
            {person.mainTheme || "Geral"}
          </Badge>
          {person.responsibleName && (
            <Badge variant="outline" className="text-[9px] uppercase font-black bg-indigo-50 border-indigo-200 text-indigo-700">
              {person.responsibleName}
            </Badge>
          )}
        </div>

        <div className="space-y-1 flex-1">
          <p className="text-[11px] font-medium leading-tight text-zinc-600 line-clamp-3">
            {person.priorityReason}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100 mt-auto shrink-0">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold">
            <span>Próxima Ação</span>
          </div>
          <p className={cn("text-xs font-black truncate", isBlocked ? "text-rose-700" : "text-indigo-700")}>
            {isBlocked ? "NÃO ABORDAR" : person.nextAction.split(":")[0]}
          </p>

          <div className="pt-2">
            <JourneyProgress 
              {...mapPersonToJourney(
                person.status,
                Boolean(person.responsibleId),
                person.hasReferral,
                person.lastInteractionAt
              )} 
              compact 
            />
          </div>

          {isBlocked && (
             <OperationalAlert type="nao_abordar" className="mt-1" />
          )}
          
          <ActionButtonGroup 
            className="pt-2 w-full justify-between"
            personId={person.id}
            instagramUsername={person.username}
            onAssume={handleAssume}
            isAssuming={isPending}
            canAssume={!person.responsibleId && !isBlocked}
          />
        </div>
      </CardContent>
    </Card>
  );
}
