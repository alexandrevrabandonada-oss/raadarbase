"use client";

import * as React from "react";
import { Instagram, Copy, UserPlus, FileText, ShieldAlert, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { recordDMPreparedAction, confirmDMSentAction } from "@/app/actions";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyProgress } from "@/components/radar/journey-progress";

interface PersonOperationalRowProps {
  person: PriorityPerson;
  index: number;
  onOpenDetails?: (person: PriorityPerson) => void;
  onAssume?: (personId: string) => void;
  isAssuming?: boolean;
}

function phaseLabel(person: PriorityPerson) {
  const journey = mapPersonToJourney(
    person.status,
    person.hasPendingTask,
    person.hasReferral,
    person.lastInteractionAt,
  );
  const labels = {
    preparar: "Preparar",
    conversar: "Conversar",
    registrar: "Registrar",
    encaminhar: "Encaminhar",
    concluir: "Concluir",
  } as const;
  return journey.isBlocked ? "Em espera" : labels[journey.currentPhase];
}

export function PersonOperationalRow({ person, index, onOpenDetails, onAssume, isAssuming }: PersonOperationalRowProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "waiting" | "confirmed">("idle");
  const isBlocked = Boolean(
    person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact,
  );

  const handleCopyDM = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (person.suggestedMessage) {
      await navigator.clipboard.writeText(person.suggestedMessage);
      toast({ title: "Mensagem preparada", description: "Revise e envie manualmente." });
      await recordDMPreparedAction(person.id, "lista_operacional");
      setCopyStatus("waiting");
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSent = () => {
    startTransition(async () => {
      const result = await confirmDMSentAction(person.id, "lista_operacional");
      if (result.ok) {
        setCopyStatus("confirmed");
        setShowConfirmDialog(false);
        toast({ title: "Etapa confirmada", description: "A missão entrou em acompanhamento." });
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <tr
      className={cn(
        "group h-16 cursor-pointer border-b border-[#d8c7ac] transition-colors hover:bg-[rgba(17,32,42,0.03)]",
        isBlocked && "bg-zinc-50",
      )}
      onClick={() => onOpenDetails?.(person)}
    >
      <td className="px-3 py-3 text-center text-[10px] font-black text-zinc-400">{index + 1}</td>
      <td className="px-2 py-3">
        <div className="min-w-[180px]">
          <p className="truncate text-sm font-black text-zinc-950">{person.displayName || `@${person.username}`}</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-zinc-400">@{person.username}</p>
        </div>
      </td>
      <td className="px-2 py-3">
        <Badge className="rounded-full border border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] text-[9px] font-black uppercase tracking-widest text-[#11202a] hover:bg-[rgba(17,32,42,0.05)]">
          {phaseLabel(person)}
        </Badge>
      </td>
      <td className="px-2 py-3">
        <p className="max-w-[240px] truncate text-[11px] font-medium text-zinc-600">{person.priorityReason}</p>
      </td>
      <td className="px-2 py-3">
        <p className="max-w-[240px] truncate text-[11px] font-black text-[#11202a]">{person.nextAction}</p>
      </td>
      <td className="px-2 py-3">
        <JourneyProgress
          {...mapPersonToJourney(person.status, person.hasPendingTask, person.hasReferral, person.lastInteractionAt)}
          compact
        />
      </td>
      <td className="px-2 py-3">
        <span className="block max-w-[220px] truncate text-[10px] font-medium text-zinc-500">
          {isBlocked
            ? person.doNotContactReason || "Bloqueio ético ativo."
            : person.riskFlags?.recentOutreach
              ? "Contato recente"
              : person.isPendingResponse
                ? "Aguardando retorno"
                : "Sem espera ativa"}
        </span>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center gap-1.5">
          {person.riskFlags?.recentOutreach && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Clock className="h-3.5 w-3.5 text-amber-500" /></TooltipTrigger>
                <TooltipContent>Contato recente</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isBlocked && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><ShieldAlert className="h-3.5 w-3.5 text-rose-500" /></TooltipTrigger>
                <TooltipContent>{person.doNotContactReason || "Não abordar esta pessoa."}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails?.(person);
            }}
            title="Abrir missão"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-400 hover:bg-pink-50 hover:text-pink-600"
            onClick={(e) => {
              e.stopPropagation();
              window.open(person.instagramUrl || `https://instagram.com/${person.username}`, "_blank");
            }}
            title="Abrir Instagram"
          >
            <Instagram className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8",
              copyStatus === "waiting"
                ? "bg-indigo-50 text-indigo-600"
                : copyStatus === "confirmed"
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-zinc-400 hover:bg-[#11202a]/5 hover:text-[#11202a]",
            )}
            onClick={handleCopyDM}
            disabled={!person.suggestedMessage || isBlocked}
            title="Preparar mensagem"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {!person.responsibleId && !isBlocked && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
              onClick={(e) => {
                e.stopPropagation();
                onAssume?.(person.id);
              }}
              disabled={isAssuming}
              title="Assumir missão"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 bg-[#0f1b24] px-3 text-[10px] font-black uppercase tracking-wider text-white hover:bg-[#172733]"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails?.(person);
            }}
          >
            Iniciar <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar envio manual</DialogTitle>
              <DialogDescription>
                Copiar não registra o envio. Confirme apenas depois de mandar manualmente a mensagem para @{person.username}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setShowConfirmDialog(false)}>
                Ainda não
              </Button>
              <Button onClick={handleConfirmSent} disabled={isPending}>
                {isPending ? "Processando..." : "Confirmar envio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  );
}

interface PersonOperationalListProps {
  people: PriorityPerson[];
  onOpenDetails?: (person: PriorityPerson) => void;
  onAssume?: (personId: string) => void;
  isAssuming?: boolean;
  className?: string;
}

export function PersonOperationalList({ people, onOpenDetails, onAssume, isAssuming, className }: PersonOperationalListProps) {
  return (
    <div className={cn("radar-outline-card relative overflow-x-auto rounded-[28px] border border-[#d8c7ac] bg-[rgba(255,250,242,0.94)] shadow-sm", className)}>
      <table className="w-full min-w-[1180px] border-collapse text-left">
        <thead className="sticky top-0 z-20 border-b border-[#d8c7ac] bg-[rgba(247,240,228,0.98)]">
          <tr>
            <th className="w-10 px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">#</th>
            <th className="min-w-[180px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Pessoa</th>
            <th className="w-36 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Fase</th>
            <th className="min-w-[220px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Motivo</th>
            <th className="min-w-[220px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Próxima ação</th>
            <th className="min-w-[160px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Progresso</th>
            <th className="min-w-[180px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Espera ou bloqueio</th>
            <th className="w-16 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Sinais</th>
            <th className="w-56 px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {people.map((person, index) => (
            <PersonOperationalRow
              key={person.id}
              person={person}
              index={index}
              onOpenDetails={onOpenDetails}
              onAssume={onAssume}
              isAssuming={isAssuming}
            />
          ))}
        </tbody>
      </table>
      {people.length === 0 && (
        <div className="py-20 text-center text-zinc-400">
          Nenhuma missão encontrada neste filtro.
        </div>
      )}
    </div>
  );
}
