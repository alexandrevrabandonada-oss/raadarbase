"use client";

import * as React from "react";
import { Instagram, Copy, UserPlus, FileText, ShieldAlert, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { InstagramSendReturnController } from "@/hooks/use-instagram-send-return";
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
import { isPriorityPersonAlreadySent } from "@/lib/outreach-status";

interface PersonOperationalRowProps {
  person: PriorityPerson;
  index: number;
  variant: "desktop" | "mobile";
  onOpenDetails?: (person: PriorityPerson) => void;
  onAssume?: (personId: string) => void;
  isAssuming?: boolean;
  onActionComplete?: (personId?: string, options?: { openNext?: boolean; refresh?: boolean }) => void;
  instagramSend: InstagramSendReturnController;
}

export function PersonOperationalRow({ person, index, variant, onOpenDetails, onAssume, isAssuming, instagramSend }: PersonOperationalRowProps) {
  const { toast } = useToast();
  const isBlocked = getPriorityPersonHoldState(person) === "blocked";
  const missionTypeLabel = getPriorityPersonMissionTypeLabel(person);
  const missionPhaseLabel = getPriorityPersonMissionPhaseLabel(person);
  const missionReason = getPriorityPersonMissionReason(person);
  const missionNextStep = getPriorityPersonMissionNextStep(person);
  const holdText = getPriorityPersonHoldText(person);
  const journey = getPriorityPersonJourney(person);
  const isAlreadySent = isPriorityPersonAlreadySent(person);
  const isThisPending = instagramSend.pendingPersonId === person.id;
  const isAnotherPending = Boolean(instagramSend.pendingPersonId && !isThisPending);
  const copyStatus = isThisPending ? instagramSend.phase : "idle";

  const handleCopyDM = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!person.suggestedMessage) return;
    const result = await instagramSend.openInstagram({
      surface: "lista_operacional",
      personId: person.id,
      templateId: person.suggestedTemplateId ?? null,
      username: person.username,
      message: person.suggestedMessage,
    });
    if (result.ok && !result.copied) {
      toast({ title: "Instagram aberto", description: result.error ?? "Copie a mensagem manualmente antes de enviar." });
    }
  };

  const handleMarkSent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThisPending) {
      await (instagramSend.phase === "error" ? instagramSend.retryConfirmation() : instagramSend.confirmNow());
      return;
    }
    await instagramSend.confirmNow({
      surface: "lista_operacional",
      personId: person.id,
      templateId: person.suggestedTemplateId ?? null,
    });
  };

  if (variant === "desktop") return (
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
              isThisPending
                ? "bg-amber-50 text-amber-700"
                : "text-zinc-400 hover:bg-[#11202a]/5 hover:text-[#11202a]",
            )}
            onClick={handleCopyDM}
            disabled={!person.suggestedMessage || isBlocked || isAlreadySent || isThisPending || isAnotherPending}
            title={isAlreadySent ? "Envio já registrado" : "Copiar e Abrir Direct"}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-2 border-black bg-white px-3 text-[10px] font-black uppercase tracking-wider text-charcoal hover:bg-charcoal/5 rounded-[2px]"
            onClick={handleMarkSent}
            disabled={isBlocked || isAlreadySent || isAnotherPending || copyStatus === "confirming"}
          >
            {copyStatus === "error" ? "Tentar registro novamente" : isThisPending ? "Registrar envio e continuar" : "Marcar enviado"}
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
      </td>
    </tr>
  );

  return (
    <div
      className={cn(
        "border-b border-black/10 p-3",
        isBlocked && "bg-zinc-50 opacity-75 grayscale-[30%]",
      )}
      onClick={() => onOpenDetails?.(person)}
    >
      <div className="space-y-3 rounded-[2px] border-2 border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-black text-zinc-950">{person.displayName || `@${person.username}`}</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-zinc-400">@{person.username}</p>
          </div>
          <span className="text-[10px] font-black text-zinc-400">{index + 1}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {missionTypeLabel ? (
            <Badge className="rounded-[2px] border-2 border-black bg-burnt-yellow/10 text-[9px] font-black uppercase tracking-wider text-charcoal hover:bg-burnt-yellow/20">
              {missionTypeLabel}
            </Badge>
          ) : null}
          <Badge className="rounded-[2px] border-2 border-black bg-white text-[9px] font-black uppercase tracking-wider text-charcoal hover:bg-white">
            {missionPhaseLabel}
          </Badge>
          <AnnouncementStatusBadge status={person.announcementStatus} />
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cement">Motivo</p>
            <p className="text-sm font-medium text-zinc-700">{missionReason}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cement">Próxima ação</p>
            <p className="text-sm font-black text-[#11202a]">{missionNextStep}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cement">Espera ou bloqueio</p>
            <p className="text-sm font-medium text-zinc-600">{holdText}</p>
          </div>
        </div>

        <JourneyProgress {...journey} compact />

        <div className="flex items-center gap-2">
          {person.riskFlags?.recentOutreach ? <Clock className="h-4 w-4 text-amber-500" /> : null}
          {isBlocked ? <ShieldAlert className="h-4 w-4 text-rose-500" /> : null}
          {isThisPending ? <Clock className="h-4 w-4 text-amber-600" /> : null}
        </div>

        <div className="space-y-2">
          <Button
            className="h-11 w-full border-2 border-black bg-burnt-yellow text-xs font-black uppercase tracking-[0.18em] text-charcoal rounded-[2px] hover:bg-burnt-yellow/90"
            onClick={handleCopyDM}
            disabled={!person.suggestedMessage || isBlocked || isThisPending || isAnotherPending || isAlreadySent}
          >
            <Copy className="mr-2 h-4 w-4" />
            {isThisPending ? "Aguardando retorno" : "Copiar e abrir"}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="h-11 border-2 border-black bg-white text-xs font-black uppercase tracking-[0.18em] text-charcoal rounded-[2px] hover:bg-charcoal/5"
              onClick={handleMarkSent}
              disabled={isBlocked || isAlreadySent || isAnotherPending || copyStatus === "confirming"}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {copyStatus === "error" ? "Tentar registro novamente" : isThisPending ? "Registrar envio e continuar" : "Marcar enviado"}
            </Button>
            <Button
              variant="outline"
              className="h-11 border-2 border-black bg-white text-xs font-black uppercase tracking-[0.14em] text-charcoal rounded-[2px]"
              onClick={(e) => {
                e.stopPropagation();
                const igUsername = person.username.replace(/^@+/, "");
                const igUrl = `https://www.instagram.com/${igUsername}/`;
                window.open(igUrl, "_blank");
              }}
              disabled={isBlocked}
            >
              <Instagram className="mr-2 h-4 w-4" />
              Instagram
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
            variant="outline"
            className="h-10 border-2 border-black bg-white text-xs font-black uppercase tracking-[0.14em] text-charcoal rounded-[2px]"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails?.(person);
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Abrir
          </Button>
            {!person.responsibleId && !isBlocked ? (
              <Button
                variant="outline"
                className="h-10 border-2 border-black bg-white text-xs font-black uppercase tracking-[0.14em] text-charcoal rounded-[2px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssume?.(person.id);
                }}
                disabled={isAssuming}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assumir
              </Button>
            ) : (
              <div className="flex h-10 items-center justify-center rounded-[2px] border-2 border-black bg-[#f7f1e6] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#645845]">
                {person.responsibleName ? `Com ${person.responsibleName}` : "Já assumida"}
              </div>
            )}
          </div>
          {!person.responsibleId && !isBlocked ? (
            <p className="px-1 text-[10px] font-semibold text-[#645845]">
              Ação principal em cima. Use &quot;Marcar enviado&quot; quando a mensagem já tiver sido mandada.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface PersonOperationalListProps {
  people: PriorityPerson[];
  onOpenDetails?: (person: PriorityPerson) => void;
  onAssume?: (personId: string) => void;
  isAssuming?: boolean;
  className?: string;
  onActionComplete?: (personId?: string, options?: { openNext?: boolean; refresh?: boolean }) => void;
  instagramSend: InstagramSendReturnController;
}

export function PersonOperationalList({ people, onOpenDetails, onAssume, isAssuming, className, onActionComplete, instagramSend }: PersonOperationalListProps) {
  return (
    <div className={cn("bloco-concreto relative overflow-hidden rounded-[2px] border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]", className)}>
      <div className="md:hidden">
        {people.map((person, index) => (
          <PersonOperationalRow
            key={person.id}
            person={person}
            index={index}
            variant="mobile"
            onOpenDetails={onOpenDetails}
            onAssume={onAssume}
            isAssuming={isAssuming}
            onActionComplete={onActionComplete}
            instagramSend={instagramSend}
          />
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
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
              variant="desktop"
              onOpenDetails={onOpenDetails}
              onAssume={onAssume}
              isAssuming={isAssuming}
              onActionComplete={onActionComplete}
              instagramSend={instagramSend}
            />
          ))}
        </tbody>
      </table>
      </div>
      {people.length === 0 && (
        <div className="py-20 text-center text-zinc-400">
          Nenhuma missão encontrada neste filtro.
        </div>
      )}
    </div>
  );
}
