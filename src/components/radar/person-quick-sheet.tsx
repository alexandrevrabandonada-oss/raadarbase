"use client";

import * as React from "react";
import { 
  Instagram, 
  Copy, 
  MessageSquare, 
  UserPlus, 
  ArrowRight, 
  ExternalLink,
  Clock,
  ShieldAlert,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
  MapPin,
  Heart,
  Zap,
  CheckCircle,
  ChevronRight
} from "lucide-react";

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PriorityPerson, InteractionWithPost, PersonResponseKind, PersonReferralType, PersonReferralStatus } from "@/lib/types";
import { PersonScoreBadge } from "./person-score-badge";
import { useToast } from "@/hooks/use-toast";
import { useCompletion } from "@/hooks/use-completion";
import Link from "next/link";
import { 
  assumePersonResponsible, 
  recordPersonResponse, 
  recordPersonReferral,
  getPersonInteractionsAction,
  updatePersonNotes,
  listFieldAgendaEventsAction,
  trackOperationalEvent,
  recordDMPreparedAction,
  confirmDMSentAction
} from "@/app/actions";
import { PERSON_RESPONSE_OPTIONS } from "@/lib/data/person-profile";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import type { FieldAgendaEvent } from "@/lib/data/field-agenda";
import { containsForbiddenMemoryTerm } from "@/lib/strategic-memory/safety";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { JourneyProgress } from "@/components/radar/journey-progress";

const REFERRAL_DETAILS: Record<PersonReferralType, { 
  hint: string; 
  nextSteps: string; 
  care: string;
  icon: React.ElementType;
  invite?: string;
}> = {
  evento_campo: {
    hint: "Pessoa demonstrou interesse em participar presencialmente.",
    nextSteps: "Será marcada como 'Interessada' na Agenda de Campo.",
    care: "Confirme o bairro e o tema do evento antes de mandar o link.",
    icon: MapPin
  },
  voluntariado: {
    hint: "Quer ajudar na campanha de forma ativa e recorrente.",
    nextSteps: "Enviamos o link de inscrição oficial (consentimento).",
    care: "Nunca cadastre a pessoa sem o consentimento explícito dela.",
    icon: Heart,
    invite: "Que alegria seu interesse! Para oficializar sua ajuda, preencha este link rápido: [LINK_VOLUNTARIO]. Vamos juntos!"
  },
  missao_eluta: {
    hint: "Disposta a participar de ações digitais coordenadas.",
    nextSteps: "Entra para a lista de transmissões de missões.",
    care: "Explique que a Missão é focada em combate à desinformação.",
    icon: Zap,
    invite: "Você tem o perfil perfeito para a Missão ÉLuta! É nosso grupo de ação digital contra fake news. Topa entrar? [LINK_MISSAO]"
  },
  grupo_lista: {
    hint: "Quer receber informações mas sem compromisso de tarefa.",
    nextSteps: "Adição ao grupo de zap ou lista de chamados.",
    care: "Verifique se a pessoa já não está em outro grupo regional.",
    icon: MessageSquare
  },
  missao_simples: {
    hint: "Ação pontual (curtir, comentar) sem vínculo profundo.",
    nextSteps: "Tarefa marcada como concluída com sucesso.",
    care: "Agradeça a interação e deixe a porta aberta.",
    icon: CheckCircle
  },
  revisar_depois: {
    hint: "Conversa em aberto, precisa de mais contexto ou decisão.",
    nextSteps: "A tarefa volta para a fila com status 'Em Espera'.",
    care: "Defina uma nota interna com o motivo da dúvida.",
    icon: Clock
  },
  nao_abordar: {
    hint: "A pessoa pediu expressamente para não ser mais contactada.",
    nextSteps: "O perfil será marcado como bloqueado em todo o sistema.",
    care: "Respeite imediatamente o pedido. É um direito de privacidade.",
    icon: ShieldAlert
  }
};

const REFERRAL_OPTIONS: Array<{ key: PersonReferralType; label: string }> = [
  { key: "evento_campo", label: "Evento de Campo" },
  { key: "voluntariado", label: "Voluntariado" },
  { key: "missao_eluta", label: "Missão ÉLuta" },
  { key: "grupo_lista", label: "Grupo / Lista" },
  { key: "missao_simples", label: "Missão Simples" },
  { key: "revisar_depois", label: "Revisar Depois" },
];

interface PersonQuickSheetProps {
  person: PriorityPerson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
  onNextPerson?: () => void;
  isTraining?: boolean;
  onTrainingAction?: (action: string, payload?: unknown) => void;
}

export function PersonQuickSheet({ 
  person, 
  open, 
  onOpenChange, 
  onActionComplete,
  onNextPerson,
  isTraining,
  onTrainingAction 
}: PersonQuickSheetProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { toast } = useToast();
  const { showCompletion } = useCompletion();
  const [interactions, setInteractions] = React.useState<InteractionWithPost[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [activeModal, setActiveModal] = React.useState<"response" | "referral" | null>(null);
  const [isResolved, setIsResolved] = React.useState(false);
  
  const [note, setNote] = React.useState("");
  const [isSavingNote, setIsSavingNote] = React.useState(false);
  
  const [events, setEvents] = React.useState<FieldAgendaEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<string>("manual");
  const [referralStatus, setReferralStatus] = React.useState<PersonReferralStatus>("interessado");
  const [createConfirmationTask, setCreateConfirmationTask] = React.useState<boolean>(true);
  const [selectedReferral, setSelectedReferral] = React.useState<PersonReferralType | null>(null);

  const [copyStatus, setCopyStatus] = React.useState<"idle" | "waiting" | "confirmed">("idle");

  const loadHistory = React.useCallback(async (personId: string) => {
    if (isTraining) {
      setInteractions([]);
      setIsLoadingHistory(false);
      return;
    }
    setInteractions([]);
    setIsLoadingHistory(true);
    try {
      const data = await getPersonInteractionsAction(personId);
      setInteractions(data || []);
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao carregar histórico.", variant: "destructive" });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [toast, isTraining]);

  const loadEvents = React.useCallback(async () => {
    try {
      const data = await listFieldAgendaEventsAction();
      setEvents(data || []);
    } catch (err) {
      console.error("Erro ao carregar eventos", err);
    }
  }, []);

  React.useEffect(() => {
    if (open && person) {
      trackOperationalEvent("quick_sheet_opened", person.id, { username: person.username });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsResolved(false);
       
      setNote(person.notes || "");
      loadHistory(person.id);
      loadEvents();
    }
  }, [open, person, loadHistory, loadEvents]);

  if (!person) return null;

  const isBlocked = !!(person.status === "nao_abordar" || person.doNotContactReason || person.riskFlags?.doNotContact);

  const handleAssume = () => {
    if (isTraining) {
      onTrainingAction?.("task_assumed");
      toast({ title: "Sucesso (Treino)", description: "Você assumiu o vínculo simulado." });
      return;
    }
    startTransition(async () => {
      const result = await assumePersonResponsible(person.id);
      if (result.ok) {
        trackOperationalEvent("task_assumed", person.id);
        toast({ title: "Sucesso", description: "Você assumiu o vínculo com esta pessoa." });
        onActionComplete?.();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleSaveNote = async () => {
    if (isTraining) {
      onTrainingAction?.("note_saved", { note });
      toast({ title: "Nota salva (Treino)", description: "A nota interna simulada foi atualizada." });
      return;
    }
    setIsSavingNote(true);
    try {
      const result = await updatePersonNotes(person.id, note);
      if (result.ok) {
        trackOperationalEvent("note_saved", person.id);
        toast({ title: "Nota salva", description: "A nota interna foi atualizada com sucesso." });
        onActionComplete?.();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao salvar nota.", variant: "destructive" });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleRecordResponse = (kind: PersonResponseKind) => {
    if (isTraining) {
      onTrainingAction?.("response_recorded", { kind });
      showCompletion("response_recorded");
      setActiveModal(null);
      setIsResolved(true);
      return;
    }
    startTransition(async () => {
      const result = await recordPersonResponse(person.id, kind);
      if (result.ok) {
        trackOperationalEvent("response_recorded", person.id, { response_kind: kind });
        if (kind === "nao_quer_contato") {
          showCompletion("dnc_respected");
        } else {
          showCompletion("response_recorded");
        }
        setActiveModal(null);
        setIsResolved(true);
        onActionComplete?.();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleRecordReferral = (target: PersonReferralType) => {
    if (isTraining) {
      onTrainingAction?.("person_referred", { target });
      showCompletion("referral_done");
      setActiveModal(null);
      setIsResolved(true);
      return;
    }
    startTransition(async () => {
      const result = await recordPersonReferral(person.id, target, {
        targetId: selectedEventId !== "manual" ? selectedEventId : undefined,
        status: target === "evento_campo" ? referralStatus : "recomendado",
        createConfirmationTask: target === "evento_campo" ? createConfirmationTask : false,
        notes: "Registrado via Ficha Rápida."
      });
      if (result.ok) {
        trackOperationalEvent("person_referred", person.id, { referral_target: target });
        showCompletion("referral_done");
        setActiveModal(null);
        setIsResolved(true);
        onActionComplete?.();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleCopyDM = async (text: string, location: string) => {
    if (isBlocked) return;
    
    // 1. Copiar
    await navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "Mensagem pronta para colar no Instagram." });
    
    // 2. Telemetria
    if (isTraining) {
      onTrainingAction?.("dm_copied", { location });
    } else {
      trackOperationalEvent("dm_copied", person.id, { location });
      await recordDMPreparedAction(person.id, location);
    }
    
    // 3. Entrar em modo de confirmação
    setCopyStatus("waiting");
  };

  const handleConfirmSent = async () => {
    if (isTraining) {
      onTrainingAction?.("dm_sent");
      setCopyStatus("confirmed");
      toast({ title: "Status Atualizado (Treino)", description: "Simulação de envio concluída." });
      return;
    }
    startTransition(async () => {
      const result = await confirmDMSentAction(person.id, "ficha_rapida");
      if (result.ok) {
        setCopyStatus("confirmed");
        toast({ title: "Status Atualizado", description: "Tarefa movida para 'Aguardando Retorno'." });
        onActionComplete?.();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={cn(
            "overflow-y-auto p-0 border-none shadow-2xl flex flex-col bg-white",
            isMobile ? "h-[90vh] rounded-t-3xl" : "w-full sm:max-w-md lg:max-w-lg h-full"
          )}
        >
          {/* Header Section */}
          <div className="bg-zinc-950 text-white p-6 pt-10 shrink-0">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 font-black uppercase text-[10px] tracking-widest">
                    Painel de missão
                  </Badge>
                  <SheetTitle className="text-2xl font-black text-white">
                    {person.displayName || `@${person.username}`}
                  </SheetTitle>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 font-black uppercase text-[10px] tracking-widest">
                    {person.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <SheetDescription className="text-zinc-400 font-bold">
                  @{person.username} • {person.mainTheme || "Geral"}
                </SheetDescription>
              </div>
              <PersonScoreBadge 
                score={person.priorityScore} 
                temperature={person.temperature} 
                tooltipText={person.scoreTooltip}
                riskFlags={person.riskFlags}
                className="scale-110"
              />
            </div>

            {/* Journey Progress Integrated */}
            <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Fase atual</p>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-200">
                  {{
                    preparar: "Preparar",
                    conversar: "Conversar",
                    registrar: "Registrar",
                    encaminhar: "Encaminhar",
                    concluir: "Concluir",
                  }[
                    mapPersonToJourney(
                      person.status,
                      person.hasPendingTask,
                      person.hasReferral,
                      person.lastInteractionAt
                    ).currentPhase
                  ]}
                </p>
              </div>
              <JourneyProgress 
                {...mapPersonToJourney(
                  person.status,
                  person.hasPendingTask,
                  person.hasReferral,
                  person.lastInteractionAt
                )} 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            {isResolved ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12 animate-in fade-in zoom-in duration-300">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-zinc-900">Ciclo fechado</h3>
                  <p className="text-sm font-medium text-zinc-500 max-w-[280px]">
                    A etapa de {person.displayName || `@${person.username}`} foi registrada. Escolha a próxima missão ou encerre este painel.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {onNextPerson && (
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-xs tracking-wider h-12"
                      onClick={() => {
                        trackOperationalEvent("next_person_clicked", person.id);
                        onNextPerson();
                      }}
                    >
                      Abrir próxima missão
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="font-black uppercase text-xs tracking-wider h-12"
                    nativeButton={false}
                    render={<Link href="/dashboard" />}
                  >
                    Voltar para Minha Fila
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="font-bold text-zinc-400 hover:text-zinc-600 text-xs"
                    onClick={() => onOpenChange(false)}
                  >
                    Fechar Ficha
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Sinais da Missão */}
                <div className="space-y-3">
                  {isBlocked && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Não Abordar</p>
                        <p className="text-xs text-rose-700 font-medium">{person.doNotContactReason || "Restrição manual ativa."}</p>
                      </div>
                    </div>
                  )}
                  {person.riskFlags?.recentOutreach && (
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-orange-900 uppercase tracking-tight">Contato Recente</p>
                        <p className="text-xs text-orange-700 font-medium">Houve uma DM manual nas últimas 24h. Evite redundância.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Painel da Missão */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-2">Contexto</label>
                      <p className="text-sm font-bold text-zinc-800 leading-relaxed">{person.priorityReason}</p>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                      <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-2">Objetivo e ação</label>
                      <p className="text-sm font-black text-indigo-900">{person.nextAction}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block px-1">Ação sugerida</label>
                    <div className="relative group">
                      <div className={cn(
                        "bg-white border border-zinc-200 p-5 rounded-xl text-sm font-medium text-zinc-700 leading-relaxed min-h-[100px] shadow-sm italic transition-all",
                        copyStatus === "waiting" && "border-indigo-400 bg-indigo-50/20"
                      )}>
                        {person.suggestedMessage || "Nenhum modelo específico sugerido para este caso."}
                      </div>
                      {person.suggestedMessage && !isBlocked && copyStatus === "idle" && (
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="absolute bottom-3 right-3 h-8 w-8"
                          onClick={() => handleCopyDM(person.suggestedMessage!, "suggested_message")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {copyStatus === "waiting" && (
                      <div className="bg-indigo-600 p-4 rounded-xl text-white space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
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
                            onClick={handleConfirmSent}
                            disabled={isPending}
                          >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle className="h-3 w-3 mr-2" />}
                            Sim, registrar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-white hover:bg-white/10 font-bold text-[10px] uppercase h-8"
                            onClick={() => setCopyStatus("idle")}
                          >
                            Ainda não
                          </Button>
                        </div>
                      </div>
                    )}

                    {copyStatus === "confirmed" && (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3 animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-bold text-emerald-900">Envio registrado. A missão agora aguarda retorno.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registro */}
                <div className="space-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block">Registro</label>
                    <Badge variant="outline" className="text-[9px] border-zinc-200 text-zinc-400 bg-white">Privado</Badge>
                  </div>
                  <Textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex: Demonstrou interesse no evento de sábado..."
                    className={cn(
                      "text-xs font-bold border-zinc-200 focus:border-indigo-300 min-h-[80px]",
                      containsForbiddenMemoryTerm(note).length > 0 && "border-amber-400 bg-amber-50/30"
                    )}
                  />
                  {containsForbiddenMemoryTerm(note).length > 0 && (
                    <div className="flex items-center gap-2 text-amber-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle className="h-3 w-3" />
                      <p className="text-[10px] font-bold uppercase tracking-tight">
                        Evite termos de perfilamento: {containsForbiddenMemoryTerm(note).join(", ")}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-zinc-400 font-medium italic">Anote apenas o necessário. Não registre dados sensíveis.</p>
                    <Button 
                      size="sm" 
                      onClick={handleSaveNote}
                      disabled={isSavingNote || note === person.notes}
                      className="h-7 text-[10px] font-black uppercase tracking-wider bg-zinc-900"
                    >
                      {isSavingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar Nota"}
                    </Button>
                  </div>
                </div>

                {/* Histórico Curto */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block px-1">Memória recente</label>
                  {isLoadingHistory ? (
                    <div className="p-8 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
                    </div>
                  ) : interactions.length > 0 ? (
                    <div className="border border-zinc-100 rounded-xl divide-y divide-zinc-50 overflow-hidden">
                      {interactions.slice(0, 3).map((interaction) => (
                        <div key={interaction.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-700 line-clamp-1">{interaction.text || interaction.type}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0">{interaction.type}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-zinc-400 font-medium italic bg-zinc-50/30 rounded-xl border border-dashed border-zinc-200">
                      Nenhuma interação recente registrada.
                    </div>
                  )}
                </div>

                {/* Encaminhamento operacional */}
                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                   <div>
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Responsável da missão</label>
                      <p className="text-sm font-black text-zinc-800">{person.responsibleName || "Sem responsável"}</p>
                   </div>
                   {!person.responsibleId && !isBlocked && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="font-black uppercase text-[10px] tracking-wider border-zinc-200"
                        onClick={handleAssume}
                        disabled={isPending}
                      >
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <UserPlus className="h-3 w-3 mr-2" />} 
                        Assumir
                      </Button>
                   )}
                </div>
              </>
            )}
          </div>

          {/* Floating Actions Footer */}
          {!isResolved && (
            <div className="fixed bottom-0 right-0 left-0 lg:left-auto lg:w-[32rem] p-6 bg-white/80 backdrop-blur-md border-t border-zinc-100 flex items-center gap-3 z-50">
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-xs tracking-wider h-12 shadow-lg shadow-indigo-100"
                onClick={() => {
                  trackOperationalEvent("instagram_opened", person.id);
                  window.open(person.instagramUrl || `https://instagram.com/${person.username}`, '_blank');
                }}
              >
                <Instagram className="h-4 w-4 mr-2" /> Instagram
              </Button>
              
              <div className="flex gap-2">
                {!isBlocked && (
                  <>
                    <Button 
                      size="icon" 
                      variant={copyStatus === "waiting" ? "default" : "outline"}
                      className={cn("h-12 w-12 border-zinc-200", copyStatus === "waiting" && "bg-indigo-600 border-indigo-600")} 
                      title="Copiar DM" 
                      disabled={!person.suggestedMessage || isPending} 
                      onClick={() => handleCopyDM(person.suggestedMessage!, "floating_footer")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-12 w-12 border-zinc-200" 
                      title="Registrar Resposta"
                      onClick={() => setActiveModal("response")}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-12 w-12 border-zinc-200" 
                      title="Encaminhar"
                      onClick={() => setActiveModal("referral")}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-12 w-12 bg-zinc-100"
                  nativeButton={false}
                  render={
                    <Link href={`/pessoas/${person.id}`} title="Ficha Completa">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  }
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Response Modal */}
      <Dialog open={activeModal === "response"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm tracking-widest text-zinc-500">Registrar etapa</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2">
            {PERSON_RESPONSE_OPTIONS.map((opt) => (
              <Button 
                key={opt.key} 
                variant="outline" 
                className="justify-start h-auto py-3 px-4 flex flex-col items-start gap-1 text-left hover:bg-zinc-50 border-zinc-100"
                onClick={() => handleRecordResponse(opt.key)}
                disabled={isPending}
              >
                <span className="font-black text-xs uppercase text-zinc-900">{opt.label}</span>
                <span className="text-[10px] text-zinc-500 font-medium">{opt.hint}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Modal Assistant */}
      <Dialog open={activeModal === "referral"} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm tracking-widest text-zinc-500">Encaminhamento da missão</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4 md:grid-cols-[240px_1fr]">
            {/* Sidebar Options */}
            <div className="space-y-2 border-r border-zinc-100 pr-4">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block px-1 mb-3">Para onde vamos?</label>
              {REFERRAL_OPTIONS.map((opt) => {
                const isSelected = selectedReferral === opt.key;
                const details = REFERRAL_DETAILS[opt.key];
                return (
                  <button 
                    key={opt.key} 
                    onClick={() => setSelectedReferral(opt.key)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "hover:bg-zinc-50 text-zinc-600"
                    )}
                  >
                    <details.icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-zinc-400")} />
                    <span className="font-black text-[11px] uppercase tracking-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Assistant Details */}
            <div className="space-y-6">
              {selectedReferral ? (() => {
                const details = REFERRAL_DETAILS[selectedReferral];
                return (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{REFERRAL_OPTIONS.find(o => o.key === selectedReferral)?.label}</h3>
                      <p className="text-sm font-medium text-zinc-500 italic">{details.hint}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                       <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                          <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block mb-2">O que acontece depois?</label>
                          <p className="text-xs font-bold text-emerald-900 leading-relaxed">{details.nextSteps}</p>
                       </div>
                       <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                          <label className="text-[10px] font-black uppercase text-rose-600 tracking-widest block mb-2">Qual cuidado tomar?</label>
                          <p className="text-xs font-bold text-rose-900 leading-relaxed">{details.care}</p>
                       </div>
                    </div>

                    {selectedReferral === "evento_campo" && events.length > 0 && (
                      <div className="space-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">Evento da Agenda</label>
                          <Select value={selectedEventId} onValueChange={(val) => setSelectedEventId(val || "manual")}>
                            <SelectTrigger className="w-full text-xs font-bold border-zinc-200 bg-white">
                              <SelectValue placeholder="Selecione um evento..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual" className="text-xs font-bold">Encaminhamento Geral</SelectItem>
                              {events.map((ev) => (
                                <SelectItem key={ev.id} value={ev.id} className="text-xs font-bold">
                                  {ev.title} ({ev.neighborhood || "Geral"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">Status Inicial</label>
                            <Select value={referralStatus} onValueChange={(val) => setReferralStatus(val as PersonReferralStatus)}>
                              <SelectTrigger className="w-full text-xs font-bold border-zinc-200 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="font-bold">
                                <SelectItem value="interessado">Interessado</SelectItem>
                                <SelectItem value="convidado">Convidado</SelectItem>
                                <SelectItem value="confirmou">Já confirmou</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex flex-col justify-center gap-1.5 pt-5">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={createConfirmationTask}
                                onChange={(e) => setCreateConfirmationTask(e.target.checked)}
                                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-zinc-900 transition-colors">Criar Tarefa Follow-up</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {details.invite && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">Texto de Convite Sugerido</label>
                        <div className="relative group">
                          <div className="bg-zinc-950 text-white p-4 rounded-xl text-xs font-medium leading-relaxed italic border border-zinc-800">
                            {details.invite}
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="absolute bottom-2 right-2 h-7 text-[10px] font-black uppercase tracking-widest"
                            onClick={() => {
                              navigator.clipboard.writeText(details.invite!);
                              toast({ title: "Copiado", description: "Convite pronto para enviar." });
                            }}
                          >
                            Copiar Convite
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
                      <Button variant="ghost" onClick={() => setActiveModal(null)} className="font-bold text-xs uppercase">Cancelar</Button>
                      <Button 
                        onClick={() => handleRecordReferral(selectedReferral)}
                        disabled={isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-xs tracking-wider px-8 h-10"
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Encaminhamento"}
                      </Button>
                    </div>
                  </div>
                );
              })() : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-300">
                  <ArrowRight className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest">Selecione um destino à esquerda</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
