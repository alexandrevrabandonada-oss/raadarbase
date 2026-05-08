"use client";

import * as React from "react";
import { Flame, Instagram, Copy, MessageSquare, UserPlus, FileText, ShieldAlert, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PriorityPerson } from "@/lib/types";
import { PersonScoreBadge } from "./person-score-badge";
import { useToast } from "@/hooks/use-toast";

interface PersonOperationalRowProps {
  person: PriorityPerson;
  index: number;
  onOpenDetails?: (person: PriorityPerson) => void;
  onAssume?: (personId: string) => void;
  isAssuming?: boolean;
}

export function PersonOperationalRow({ person, index, onOpenDetails, onAssume, isAssuming }: PersonOperationalRowProps) {
  const { toast } = useToast();
  const isBlocked = person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact;

  const handleCopyDM = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (person.suggestedMessage) {
      navigator.clipboard.writeText(person.suggestedMessage);
      toast({ title: "Copiado", description: "Mensagem pronta para colar." });
    }
  };

  const handleOpenInstagram = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(person.instagramUrl || `https://instagram.com/${person.username}`, '_blank');
  };

  const handleAssumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAssume?.(person.id);
  };

  return (
    <tr 
      className={cn(
        "group border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors cursor-pointer h-14",
        person.temperature === "quente" && "bg-orange-50/5"
      )}
      onClick={() => onOpenDetails?.(person)}
    >
      {/* 1. Ranking */}
      <td className="py-2 px-3 text-center w-10">
        <span className="text-[10px] font-black text-zinc-400">#{index + 1}</span>
      </td>

      {/* 2. Nome / @ */}
      <td className="py-2 px-2 min-w-[160px] max-w-[240px]">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-black truncate leading-tight text-zinc-900" title={person.displayName || person.username}>
              {person.displayName || person.username}
            </span>
            {person.temperature === "quente" && <Flame className="h-3 w-3 text-orange-500 fill-orange-500 shrink-0" />}
          </div>
          <span className="text-[10px] text-zinc-400 font-bold truncate">
            @{person.username}
          </span>
        </div>
      </td>

      {/* 3. Score & Temp */}
      <td className="py-2 px-2 text-center w-24">
        <PersonScoreBadge score={person.priorityScore} temperature={person.temperature} className="scale-90 origin-center" />
      </td>

      {/* 4. Tema */}
      <td className="py-2 px-2 w-28">
        <Badge variant="outline" className="text-[9px] font-black uppercase bg-white border-zinc-200 text-zinc-600 truncate max-w-[100px]">
          {person.mainTheme || "Geral"}
        </Badge>
      </td>

      {/* 5. Status */}
      <td className="py-2 px-2 w-32">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-tight truncate block",
          isBlocked ? "text-rose-600" : "text-indigo-600"
        )}>
          {isBlocked ? "NÃO ABORDAR" : person.status.replace(/_/g, " ")}
        </span>
      </td>

      {/* 6. Responsável */}
      <td className="py-2 px-2 w-32">
        <span className="text-[10px] font-bold text-zinc-500 truncate block max-w-[110px]">
          {person.responsibleName || "-"}
        </span>
      </td>

      {/* 7. Próxima Ação */}
      <td className="py-2 px-2 min-w-[200px]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className={cn(
                "text-[10px] font-black uppercase truncate max-w-[250px] flex items-center gap-2",
                isBlocked ? "text-rose-600" : "text-zinc-800"
              )}>
                <ChevronRight className="h-3 w-3 shrink-0 text-zinc-300" />
                <span className="truncate">{isBlocked ? "Ver motivo da restrição" : person.nextAction}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px] p-3 shadow-xl">
              <p className="text-xs font-black text-indigo-900 mb-1">{person.nextAction}</p>
              <p className="text-[10px] leading-relaxed text-zinc-600">{person.priorityReason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>

      {/* 8. Alertas */}
      <td className="py-2 px-2 w-16">
        <div className="flex items-center gap-1.5">
          {person.riskFlags?.recentOutreach && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Clock className="h-3.5 w-3.5 text-amber-500" /></TooltipTrigger>
                <TooltipContent>Contato recente (nas últimas 24h)</TooltipContent>
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

      {/* 9. Ações Rápidas */}
      <td className="py-2 px-4 text-right w-44">
        <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={(e) => { e.stopPropagation(); onOpenDetails?.(person); }}
            title="Abrir Ficha"
          >
            <FileText className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-zinc-400 hover:text-pink-600 hover:bg-pink-50"
            onClick={handleOpenInstagram}
            title="Abrir Instagram"
          >
            <Instagram className="h-4 w-4" />
          </Button>

          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={handleCopyDM}
            disabled={!person.suggestedMessage || !!isBlocked}
            title="Copiar DM"
          >
            <Copy className="h-4 w-4" />
          </Button>

          {!person.responsibleId && !isBlocked && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
              onClick={handleAssumeClick}
              disabled={isAssuming}
              title="Assumir Vínculo"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
            onClick={(e) => { e.stopPropagation(); onOpenDetails?.(person); }}
            title="Registrar Resposta"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
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
    <div className={cn("relative overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm", className)}>
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead className="sticky top-0 z-20 bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th className="py-3 px-3 text-center text-[10px] font-black uppercase text-zinc-400 tracking-widest w-10">#</th>
            <th className="py-3 px-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest min-w-[160px]">Pessoa</th>
            <th className="py-3 px-2 text-center text-[10px] font-black uppercase text-zinc-400 tracking-widest w-24">Score</th>
            <th className="py-3 px-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest w-28">Tema</th>
            <th className="py-3 px-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest w-32">Status</th>
            <th className="py-3 px-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest w-32">Dono</th>
            <th className="py-3 px-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest min-w-[200px]">Próxima Ação</th>
            <th className="py-3 px-2 text-[10px] font-black uppercase text-zinc-400 tracking-widest w-16">Alertas</th>
            <th className="py-3 px-4 text-right text-[10px] font-black uppercase text-zinc-400 tracking-widest w-44">Ações</th>
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
        <div className="py-20 text-center text-zinc-400 font-medium italic">
          Nenhuma pessoa encontrada neste filtro.
        </div>
      )}
    </div>
  );
}
