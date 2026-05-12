"use client";

import { PriorityPerson } from "@/lib/types";
import { 
  Instagram, 
  Copy, 
  MessageSquare, 
  ArrowRight, 
  Flame, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FastForward,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QueueCardProps {
  person: PriorityPerson;
  onCopyDM: () => void;
  onRegisterResponse: () => void;
  onReferral: () => void;
  onSkip: () => void;
  onNext: () => void;
  copyStatus?: "idle" | "waiting" | "confirmed";
  onConfirmSent?: () => void;
  onCancelCopy?: () => void;
}

export function QueueCard({
  person,
  onCopyDM,
  onRegisterResponse,
  onReferral,
  onSkip,
  onNext,
  copyStatus = "idle",
  onConfirmSent,
  onCancelCopy,
}: QueueCardProps) {
  const isBlocked = person.riskFlags.doNotContact;
  const temperatureColors = {
    quente: "bg-orange-100 text-orange-700 border-orange-200",
    morno: "bg-amber-100 text-amber-700 border-amber-200",
    frio: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <Card className="overflow-hidden border-zinc-200 shadow-xl bg-white ring-1 ring-zinc-950/5">
      <CardHeader className="p-0">
        <div className="bg-zinc-950 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black shadow-lg">
              {person.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight">@{person.username}</h2>
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 font-black">
                  SCORE {person.priorityScore}
                </Badge>
              </div>
              <p className="text-zinc-400 font-medium">{person.displayName || "Pessoa da Base"}</p>
            </div>
          </div>
          <Badge className={cn("px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest border-2", temperatureColors[person.temperature])}>
            {person.temperature === "quente" && <Flame className="h-3 w-3 mr-1.5 fill-current" />}
            {person.temperature}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {/* Contexto Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-2">
                Por que priorizar?
              </label>
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                <p className="text-indigo-900 font-bold leading-relaxed">{person.priorityReason}</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-2">
                Próxima Ação
              </label>
              <p className="text-zinc-900 font-medium flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-indigo-600" />
                {person.nextAction}
              </p>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Última Interação</span>
                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  {person.latestInteractionLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-2">
                Mensagem Sugerida
              </label>
              <div className="group relative">
                <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl text-sm font-medium text-zinc-800 leading-relaxed min-h-[120px]">
                  {person.suggestedMessage || "Nenhum modelo ideal encontrado para esta interação."}
                </div>
                {person.suggestedMessage && (
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className={cn(
                      "absolute bottom-3 right-3 h-8 w-8 shadow-sm transition-all",
                      copyStatus === "waiting" ? "bg-indigo-600 text-white" : "hover:bg-white"
                    )}
                    onClick={onCopyDM}
                    disabled={isBlocked}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {copyStatus === "waiting" && (
                <div className="mt-4 bg-indigo-600 p-4 rounded-xl text-white space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg border border-indigo-500">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold leading-tight">
                      Copiar não registra o envio. Confirme apenas depois de mandar manualmente no Instagram.
                    </p>
                  </div>
                  <p className="text-xs font-black uppercase tracking-tight">Já enviou no Instagram?</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-white text-indigo-600 hover:bg-white/90 font-black uppercase text-[10px] tracking-wider h-8 flex-1"
                      onClick={onConfirmSent}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-2" />
                      Sim, registrar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-white hover:bg-white/10 font-bold text-[10px] uppercase h-8"
                      onClick={onCancelCopy}
                    >
                      Ainda não
                    </Button>
                  </div>
                </div>
              )}

              {copyStatus === "confirmed" && (
                <div className="mt-4 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between animate-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-tight">Envio registrado!</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-emerald-700 font-black uppercase text-[10px] h-7 hover:bg-emerald-100"
                    onClick={onNext}
                  >
                    Próxima Pessoa <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
              {person.suggestedTemplateName && (
                <p className="text-[10px] text-zinc-400 mt-2 font-bold italic">
                  Template: {person.suggestedTemplateName}
                </p>
              )}
            </div>

            {/* Risk Alerts */}
            <div className="space-y-2">
              {person.riskFlags.recentOutreach && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <p className="text-xs font-black text-rose-900 uppercase tracking-tight">Contato recente feito hoje</p>
                </div>
              )}
              {person.riskFlags.doNotContact && (
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 text-zinc-400 shrink-0" />
                  <p className="text-xs font-black text-white uppercase tracking-tight italic">Não Abordar Ativo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center gap-4">
        <Button 
          size="lg" 
          className="bg-pink-600 hover:bg-pink-700 font-black uppercase text-xs tracking-wider h-14 px-8 shadow-lg shadow-pink-200"
          onClick={() => window.open(person.instagramUrl || `https://instagram.com/${person.username}`, '_blank')}
        >
          <Instagram className="mr-2 h-5 w-5" /> Abrir Instagram
        </Button>

        <Button 
          size="lg" 
          variant="outline"
          className={cn(
            "border-zinc-200 font-black uppercase text-xs tracking-wider h-14 px-8",
            copyStatus === "waiting" ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white hover:bg-white hover:text-indigo-600"
          )}
          onClick={onCopyDM}
          disabled={!person.suggestedMessage || isBlocked}
        >
          <Copy className={cn("mr-2 h-5 w-5", copyStatus === "waiting" ? "text-indigo-600" : "text-zinc-400")} /> 
          {copyStatus === "waiting" ? "Preparado..." : "Copiar DM"}
        </Button>

        <div className="h-10 w-px bg-zinc-200 mx-2 hidden lg:block" />

        <Button 
          size="lg" 
          className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-xs tracking-wider h-14 px-8 shadow-lg shadow-indigo-200"
          onClick={onRegisterResponse}
        >
          <MessageSquare className="mr-2 h-5 w-5" /> Registrar Resposta
        </Button>

        <Button 
          size="lg" 
          variant="ghost"
          className="text-zinc-500 hover:text-amber-600 font-black uppercase text-xs tracking-wider h-14"
          onClick={onReferral}
        >
          <ArrowRight className="mr-2 h-5 w-5" /> Encaminhar
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button 
            size="lg" 
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-600 font-black uppercase text-xs tracking-wider h-14"
            onClick={onSkip}
          >
            <FastForward className="mr-2 h-5 w-5" /> Pular
          </Button>
          <Button 
            size="lg" 
            variant="secondary"
            className="font-black uppercase text-xs tracking-wider h-14 px-8 bg-zinc-200 hover:bg-zinc-300"
            onClick={onNext}
          >
            Próxima <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
