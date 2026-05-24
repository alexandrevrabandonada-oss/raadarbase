"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { 
  Flame, 
  UserPlus, 
  Instagram,
  Copy,
  Info,
  Clock,
  MessageSquare,
  Milestone,
  ArrowRight,
  ShieldAlert,
  Search,
  Users,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PriorityPerson } from "@/lib/types";
import { assumePersonResponsible } from "@/app/actions";
import { cn } from "@/lib/utils";

type Operator = { id: string; email: string; full_name: string | null; role: string };

interface PersonComponentProps {
  person: PriorityPerson;
  index: number;
  operators?: Operator[];
  onActionComplete?: () => void;
}

export function PersonScoreExplanation({ person }: { person: PriorityPerson }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex flex-col items-end cursor-help hover:opacity-80 transition-opacity">
            <Badge variant="outline" className={cn(
              "text-[10px] uppercase tracking-tight",
              person.temperature === "quente" ? "bg-orange-50 text-orange-700 border-orange-200" :
              person.temperature === "morno" ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-blue-50 text-blue-700 border-blue-200"
            )}>
              Score {person.priorityScore}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-4 shadow-xl" align="end" sideOffset={8}>
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-sm text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-600" />
                Por que este score?
              </h4>
              <p className="text-xs text-muted-foreground">{person.scoreTooltip}</p>
            </div>
            
            <div className="space-y-2 pt-3 border-t border-zinc-100">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Alertas de Risco</h5>
              <div className="flex flex-col gap-1.5">
                {person.riskFlags?.doNotContact ? (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <strong>Bloqueado:</strong> A pessoa pediu para não ser abordada.
                  </div>
                ) : null}
                {person.riskFlags?.recentOutreach ? (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                    <Clock className="h-4 w-4 shrink-0" />
                    <strong>Contato Recente:</strong> Aguarde antes de insistir.
                  </div>
                ) : null}
                {person.riskFlags?.noReferralAfterResponse ? (
                  <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100">
                    <Milestone className="h-4 w-4 shrink-0" />
                    <strong>A Encaminhar:</strong> A pessoa respondeu e precisa de direcionamento.
                  </div>
                ) : null}
                {!person.riskFlags?.doNotContact && !person.riskFlags?.recentOutreach && !person.riskFlags?.noReferralAfterResponse ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Caminho livre para contato.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PersonCardPremium({ person, index, onActionComplete }: PersonComponentProps) {
  const [isPending, startTransition] = useTransition();

  function handleAssume() {
    startTransition(async () => {
      await assumePersonResponsible(person.id);
      onActionComplete?.();
    });
  }

  const isBlocked = person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact;

  return (
    <Card 
      className={cn(
        "relative group border-2 transition-all hover:shadow-xl flex flex-col h-full",
        person.temperature === "quente" ? "border-orange-200 hover:-translate-y-1" : "border-zinc-100",
        isBlocked ? "opacity-75 grayscale-[50%]" : ""
      )}
    >
      <div className={cn(
        "absolute -top-3 -left-3 h-8 w-8 rounded-full text-white flex items-center justify-center font-black text-sm shadow-lg z-10",
        person.temperature === "quente" ? "bg-orange-600" : "bg-black"
      )}>
        #{index + 1}
      </div>

      <CardHeader className="pb-2 pt-6 shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 min-w-0 pr-4">
            <CardTitle className="text-base font-black truncate" title={person.displayName || `@${person.username}`}>
              {person.displayName || `@${person.username}`}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
              {person.temperature === "quente" && <Flame className="h-3 w-3 text-orange-500 fill-orange-500 shrink-0" />}
              <span className="truncate text-muted-foreground">@{person.username}</span>
            </div>
          </div>
          <PersonScoreExplanation person={person} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[9px] uppercase font-black bg-zinc-50 border-zinc-200">
            {person.mainTheme || "Geral"}
          </Badge>
          {person.responsibleName && (
            <Badge variant="outline" className="text-[9px] uppercase font-black bg-indigo-50 border-indigo-200 text-indigo-700">
              <Users className="h-3 w-3 mr-1" /> {person.responsibleName}
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
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1 font-bold h-9 p-0">
              <Link href={`/pessoas/${person.id}`} className="w-full h-full flex items-center justify-center">
                Ver ficha
              </Link>
            </Button>
            
            {person.responsibleId ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 cursor-help">
                      <Users className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Responsável: {person.responsibleName}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 shrink-0"
                onClick={handleAssume}
                disabled={isPending}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PersonListItem({ person, index, onActionComplete }: PersonComponentProps) {
  const [isPending, startTransition] = useTransition();

  function handleAssume() {
    startTransition(async () => {
      await assumePersonResponsible(person.id);
      onActionComplete?.();
    });
  }

  const isBlocked = person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact;

  return (
    <div className={cn(
      "group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border transition-all hover:bg-zinc-50/50",
      person.temperature === "quente" ? "border-orange-100 bg-orange-50/10" : "border-zinc-100 bg-white",
      isBlocked ? "opacity-75 grayscale-[50%]" : ""
    )}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 font-black text-xs shrink-0">
          {index + 1}
        </div>
        
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm truncate" title={person.displayName || `@${person.username}`}>
              {person.displayName || `@${person.username}`}
            </span>
            <PersonScoreExplanation person={person} />
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

      <div className="flex items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-0 border-zinc-100">
        <div className="hidden lg:flex flex-col items-end px-4 border-r border-zinc-100">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Status</span>
          <span className={cn("text-xs font-black truncate", isBlocked ? "text-rose-700" : "text-indigo-700")}>
            {isBlocked ? "NÃO ABORDAR" : (person.status.replace("_", " ").toUpperCase())}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {!person.responsibleId && !isBlocked && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
              onClick={handleAssume}
              disabled={isPending}
            >
              Assumir
            </Button>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-pink-600 p-0" onClick={() => {
                  const igUsername = person.username.replace(/^@+/, "");
                  window.open(`https://www.instagram.com/${igUsername}/`, '_blank');
                }}>
                  <Instagram className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Abrir Instagram</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button size="sm" className="h-8 text-xs font-bold px-3 p-0">
            <Link href={`/pessoas/${person.id}`} className="w-full h-full flex items-center justify-center px-3">
              Ver ficha
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
