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
import { JourneyProgress } from "@/components/radar/journey-progress";
import { AnnouncementStatusBadge } from "@/components/radar/announcement-status-badge";
import {
  getPriorityPersonHoldState,
  getPriorityPersonHoldText,
  getPriorityPersonJourney,
  getPriorityPersonMissionNextStep,
  getPriorityPersonMissionPhaseLabel,
  getPriorityPersonMissionReason,
  getPriorityPersonMissionTypeLabel,
} from "@/lib/missions/priority-person-mission-adapter";

interface PersonOperationalRowProps {
  person: PriorityPerson;
  index: number;
  onOpenDetails?: (person: PriorityPerson) => void;
  onAssume?: (personId: string) => void;
  isAssuming?: boolean;
}

export function PersonOperationalRow({ person, index, onOpenDetails, onAssume, isAssuming }: PersonOperationalRowProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "waiting" | "confirmed">("idle");
  const isBlocked = getPriorityPersonHoldState(person) === "blocked";
  const missionTypeLabel = getPriorityPersonMissionTypeLabel(person);
  const missionPhaseLabel = getPriorityPersonMissionPhaseLabel(person);
  const missionReason = getPriorityPersonMissionReason(person);
  const missionNextStep = getPriorityPersonMissionNextStep(person);
  const holdText = getPriorityPersonHoldText(person);
  const journey = getPriorityPersonJourney(person);

  const handleCopyDM = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (person.suggestedMessage) {
      await navigator.clipboard.writeText(person.suggestedMessage);
      
      const igUsername = person.username.replace(/^@+/, "");
      const igUrl = `https://www.instagram.com/${igUsername}/`;
      window.open(igUrl, "_blank");

      const expressMode = typeof window !== "undefined" && localStorage.getItem("radar_envio_expresso") === "true";

      if (expressMode) {
        toast({ title: "Envio Expresso Ativo", description: "Mensagem copiada, direct aberto e contato marcado como enviado!" });
        await recordDMPreparedAction(person.id, "lista_operacional", person.suggestedTemplateId);
        startTransition(async () => {
          const result = await confirmDMSentAction(person.id, "lista_operacional", person.suggestedTemplateId);
          if (result.ok) {
            setCopyStatus("confirmed");
          } else {
            toast({ title: "Erro", description: result.error, variant: "destructive" });
          }
        });
      } else {
        toast({ title: "Mensagem copiada", description: "Enviando você ao Direct do Instagram..." });
        await recordDMPreparedAction(person.id, "lista_operacional", person.suggestedTemplateId);
        setCopyStatus("waiting");
        setShowConfirmDialog(true);
      }
    }
  };

  const handleConfirmSent = () => {
    startTransition(async () => {
      const result = await confirmDMSentAction(person.id, "lista_operacional", person.suggestedTemplateId);
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
        "group h-16 cursor-pointer border-b border-black/10 transition-colors hover:bg-charcoal/5",
        isBlocked && "bg-zinc-50 opacity-75 grayscale-[30%]",
      )}
      onClick={() => onOpenDetails?.(person)}
    >
      <td className="px-3 py-3 text-center text-[10px] font-black text-zinc-400">{index + 1}</td>
      <td className="px-2 py-3">
        <div className="min-w-[160px]">
          <p className="truncate text-sm font-black text-zinc-950">{person.displayName || `@${person.username}`}</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-zinc-400">@{person.username}</p>
        </div>
      </td>
      <td className="px-2 py-3">
        <div className="flex flex-wrap gap-1.5">
          {missionTypeLabel ? (
            <Badge className="rounded-[2px] border-2 border-black bg-burnt-yellow/10 text-[9px] font-black uppercase tracking-wider text-charcoal hover:bg-burnt-yellow/20">
              {missionTypeLabel}
            </Badge>
          ) : null}
          <Badge className="rounded-[2px] border-2 border-black bg-white text-[9px] font-black uppercase tracking-wider text-charcoal hover:bg-white">
            {missionPhaseLabel}
          </Badge>
        </div>
      </td>
      <td className="px-2 py-3">
        <AnnouncementStatusBadge status={person.announcementStatus} />
      </td>
      <td className="px-2 py-3">
        <p className="max-w-[190px] truncate text-[11px] font-medium text-zinc-600 xl:max-w-[220px]" title={missionReason}>{missionReason}</p>
      </td>
      <td className="px-2 py-3">
        <p className="max-w-[190px] truncate text-[11px] font-black text-[#11202a] xl:max-w-[220px]" title={missionNextStep}>{missionNextStep}</p>
      </td>
      <td className="px-2 py-3">
        <JourneyProgress {...journey} compact />
      </td>
      <td className="px-2 py-3">
        <span className="block max-w-[170px] truncate text-[10px] font-medium text-zinc-500 xl:max-w-[220px]">
          {holdText}
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
            className="h-8 w-8 text-zinc-400 hover:bg-pink-50 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={(e) => {
              e.stopPropagation();
              const igUsername = person.username.replace(/^@+/, "");
              const igUrl = `https://www.instagram.com/${igUsername}/`;
              window.open(igUrl, "_blank");
            }}
            disabled={isBlocked}
            title={isBlocked ? "Contato bloqueado" : "Abrir Instagram"}
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
            title="Copiar e Abrir Direct"
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
            className="h-8 border-2 border-black bg-burnt-yellow px-3 text-[10px] font-black uppercase tracking-wider text-charcoal hover:bg-burnt-yellow/90 rounded-[2px]"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails?.(person);
            }}
          >
            Iniciar <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md border-2 border-black bg-white rounded-[2px] shadow-[6px_6px_0px_0px_rgba(11,11,11,1)] p-6">
            <DialogHeader>
              <DialogTitle className="font-black text-lg uppercase tracking-tight text-charcoal">Confirmar envio manual</DialogTitle>
              <DialogDescription className="font-semibold text-xs text-charcoal/80">
                A mensagem sugerida foi copiada e o Direct foi aberto. Confirme abaixo somente após enviar para @{person.username}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 border-t border-black/10 pt-4">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="border-2 border-black rounded-[2px] font-black text-charcoal bg-white hover:bg-charcoal/5">
                Ainda não
              </Button>
              <Button onClick={handleConfirmSent} disabled={isPending} className="border-2 border-black bg-burnt-yellow text-charcoal rounded-[2px] font-black hover:bg-burnt-yellow/90 shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]">
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
    <div className={cn("bloco-concreto relative overflow-x-auto rounded-[2px] border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]", className)}>
      <table className="w-full min-w-[980px] border-collapse text-left xl:min-w-[1080px]">
        <thead className="sticky top-0 z-20 border-b-2 border-black bg-charcoal text-white">
          <tr>
            <th className="w-10 px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-white">#</th>
            <th className="min-w-[160px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-white">Pessoa</th>
            <th className="w-36 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-white">Fase</th>
            <th className="w-36 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-white">Aviso</th>
            <th className="min-w-[180px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-white xl:min-w-[220px]">Motivo</th>
            <th className="min-w-[180px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-white xl:min-w-[220px]">Próxima ação</th>
            <th className="min-w-[140px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-white">Progresso</th>
            <th className="min-w-[150px] px-2 py-3 text-[10px] font-black uppercase tracking-widest text-white xl:min-w-[180px]">Espera ou bloqueio</th>
            <th className="w-16 px-2 py-3 text-[10px] font-black uppercase tracking-widest text-white">Sinais</th>
            <th className="w-44 px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white xl:w-56">Ações</th>
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
