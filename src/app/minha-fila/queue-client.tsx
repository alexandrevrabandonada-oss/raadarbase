"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { PriorityPerson, PersonResponseKind, PersonReferralType } from "@/lib/types";
import { QueueCard } from "./queue-card";
import { QueueList } from "./queue-list";
import { EthicalGuardrailBanner } from "@/components/radar/ethical-guardrail-banner";
import { Button } from "@/components/ui/button";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";
import { GamefulHero, GamefulHeroBadge } from "@/components/radar/gameful-hero";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { OperationalCommandBar } from "@/components/radar/operational-command-bar";
import {
  PlusCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  HeartHandshake,
  Smartphone,
  LayoutDashboard,
  ShieldAlert,
  History,
  Flame,
  Compass,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Coffee,
  MapPinned,
  PauseCircle,
  Route,
  TowerControl,
  Instagram,
  Copy,
  MessageSquare,
  Trophy,
  Award,
} from "lucide-react";
import {
  trackOperationalEvent,
  recordPersonResponse,
  recordPersonReferral,
  recordDMPreparedAction,
  confirmDMSentAction,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useCompletion } from "@/hooks/use-completion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OperatorWellnessCard } from "@/components/radar/wellness/operator-wellness-card";
import { assessQueueWellness } from "@/lib/data/operator-wellness";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { useCompactMode } from "@/hooks/use-compact-mode";
import { CompactModeToggle } from "@/components/radar/compact-mode-toggle";
import type { RadarMission } from "@/lib/missions/mission-types";
import { buildRecommendedMissionBlock, type MinhaJornadaWorkMode, type QueueMissionPlan } from "@/lib/missions/queue-mission-adapter";

interface QueueClientProps {
  initialQueue: PriorityPerson[];
  oldPendencies?: PriorityPerson[];
  operatorName: string;
  missionPlan?: QueueMissionPlan | null;
}

const RESPONSE_OPTIONS: Array<{
  id: PersonResponseKind;
  label: string;
  hint: string;
  icon: typeof CheckCircle2;
}> = [
  { id: "nao_respondeu", label: "Sem retorno", hint: "A conversa segue em espera.", icon: XCircle },
  { id: "respondeu_bem", label: "Respondeu bem", hint: "A missão avançou com boa abertura.", icon: CheckCircle2 },
  { id: "pediu_informacoes", label: "Pediu informações", hint: "Registrar dúvida e seguir na conversa.", icon: HelpCircle },
  { id: "quer_ir_evento", label: "Quer evento", hint: "Há chance de campo concreto.", icon: Calendar },
  { id: "quer_ajudar_presencial", label: "Quer ajudar", hint: "Encaminhar para voluntariado ou campo.", icon: HeartHandshake },
  { id: "quer_conhecer_missao_eluta", label: "Quer missão digital", hint: "Boa candidata para ação coordenada.", icon: Smartphone },
  { id: "nao_quer_contato", label: "Não quer contato", hint: "A restrição ética precisa ser respeitada.", icon: ShieldAlert },
  { id: "revisar_depois", label: "Revisar depois", hint: "Volta para fila com mais contexto.", icon: History },
];

const REFERRAL_OPTIONS: Array<{
  id: PersonReferralType;
  label: string;
  hint: string;
}> = [
  { id: "evento_campo", label: "Missão de Campo", hint: "Conectar a pessoa a uma ação presencial." },
  { id: "voluntariado", label: "Voluntariado", hint: "Encaminhar para ajuda recorrente." },
  { id: "missao_eluta", label: "Missão ÉLuta", hint: "Encaminhar para ação digital coordenada." },
  { id: "grupo_lista", label: "Grupo ou Lista", hint: "Manter vínculo por canal de acompanhamento." },
  { id: "missao_simples", label: "Missão simples", hint: "Fechar ciclo com uma ação pontual." },
  { id: "revisar_depois", label: "Revisar depois", hint: "Segurar a decisão e voltar com contexto." },
  { id: "nao_abordar", label: "Não abordar", hint: "Fechar missão por consentimento ou segurança." },
];

const WORK_MODE_OPTIONS: Array<{
  id: MinhaJornadaWorkMode;
  label: string;
  hint: string;
}> = [
  { id: "recommended", label: "Recomendado", hint: "Bloco equilibrado para manter o ritmo." },
  { id: "returns", label: "Resolver retornos", hint: "Fechar ciclos e confirmar envios." },
  { id: "listening", label: "Fazer escuta", hint: "Preparar abordagem e abrir vínculo." },
  { id: "routing", label: "Encaminhar interessados", hint: "Dar destino com consentimento." },
  { id: "care", label: "Cuidar da base", hint: "Revisar bloqueios, pausas e travas." },
];

function missionPhaseLabel(person: PriorityPerson) {
  const journey = mapPersonToJourney(
    person.status,
    person.hasPendingTask,
    person.hasReferral,
    person.lastInteractionAt,
  );
  const labels = {
    preparar: "Preparar terreno",
    conversar: "Abrir conversa",
    registrar: "Registrar retorno",
    encaminhar: "Encaminhar interesse",
    concluir: "Fechar ciclo",
  } as const;

  return journey.isBlocked ? "Janela em espera" : labels[journey.currentPhase];
}

function missionTypeLabel(type: RadarMission["type"]) {
  const labels: Record<RadarMission["type"], string> = {
    ESCUTA: "Escuta",
    VINCULO: "Vínculo",
    RETORNO: "Retorno",
    ENCAMINHAMENTO: "Encaminhamento",
    CUIDADO: "Cuidado",
    CAMPO: "Campo",
    MEMORIA: "Memória",
  };

  return labels[type];
}

function missionStateLabel(state: RadarMission["state"]) {
  const labels: Record<RadarMission["state"], string> = {
    SUGERIDA: "Sugerida",
    ASSUMIDA: "Assumida",
    EM_ANDAMENTO: "Em andamento",
    EM_ESPERA: "Em espera",
    BLOQUEADA: "Bloqueada",
    CONCLUIDA: "Concluída",
    ARQUIVADA: "Arquivada",
  };

  return labels[state];
}

function missionFeedback(kind: PersonResponseKind) {
  switch (kind) {
    case "nao_quer_contato":
      return { title: "Pedido de não contato respeitado.", description: "A restrição foi mantida e a base segue protegida." };
    case "revisar_depois":
    case "manter_aguardando":
    case "arquivar_sem_retorno":
      return { title: "Missão pausada sem perda de histórico.", description: "O contexto ficou salvo para uma retomada segura." };
    default:
      return { title: "Resposta registrada. Próximo passo salvo.", description: "A jornada foi atualizada sem perder o contexto." };
  }
}

export function QueueClient({ initialQueue, oldPendencies = [], operatorName, missionPlan = null }: QueueClientProps) {
  const { toast } = useToast();
  const { showCompletion } = useCompletion();
  const [queue, setQueue] = useState(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "waiting" | "confirmed">("idle");
  const [focusMode, setFocusMode] = useState(false);
  const [streak, setStreak] = useState(() => {
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().split("T")[0];
      const key = `radar_streak_${today}`;
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const incrementStreak = () => {
    setStreak((prev) => {
      const next = prev + 1;
      if (typeof window !== "undefined") {
        const today = new Date().toISOString().split("T")[0];
        const key = `radar_streak_${today}`;
        localStorage.setItem(key, next.toString());
      }
      return next;
    });
  };
  const [isNotebookViewport, setIsNotebookViewport] = useState(false);
  const [workMode, setWorkMode] = useState<MinhaJornadaWorkMode>("recommended");

  useEffect(() => {
    trackOperationalEvent("minha_fila_opened");
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setIsNotebookViewport(window.innerWidth < 1366);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const wellness = assessQueueWellness(queue.length);
  const completedCount = Math.min(currentIndex, queue.length);
  const progressPercent = queue.length === 0 ? 0 : Math.round((completedCount / queue.length) * 100);
  const {
    hydrated: compactHydrated,
    manualCompact,
    isCompact,
    setCompact,
  } = useCompactMode({
    storageKey: "radar_minha_jornada_compacto",
    autoCompact: isNotebookViewport || queue.length > 5,
  });
  const missionFeed = useMemo(() => missionPlan?.missions ?? [], [missionPlan]);
  const missionBySubjectId = useMemo(
    () =>
      new Map(
        missionFeed
          .filter((mission) => mission.subjectType === "person" && Boolean(mission.subjectId))
          .map((mission) => [mission.subjectId!, mission]),
      ),
    [missionFeed],
  );
  const recommendedMissions = useMemo(
    () => buildRecommendedMissionBlock(missionFeed, workMode),
    [missionFeed, workMode],
  );

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCopyStatus("idle");
    }
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCopyStatus("idle");
    } else {
      toast({ title: "Fim da trilha", description: "Você chegou ao fim da fila atual." });
    }
  };

  const handleSkip = () => {
    toast({
      title: "Missão pausada sem perda de histórico.",
      description: `@${currentPerson.username} saiu da vez por agora. A trilha segue com o contexto preservado.`,
    });
    handleNext();
  };

  const handleCopyDM = async () => {
    if (currentPerson.suggestedMessage) {
      await navigator.clipboard.writeText(currentPerson.suggestedMessage);
      toast({ title: "Mensagem preparada", description: "Revise e envie manualmente no Instagram." });
      await recordDMPreparedAction(currentPerson.id, "minha_fila");
      setCopyStatus("waiting");
    }
  };

  const handleConfirmSent = async () => {
    startTransition(async () => {
      const result = await confirmDMSentAction(currentPerson.id, "minha_fila");
      if (result.ok) {
        setCopyStatus("confirmed");
        toast({ title: "Envio manual confirmado.", description: "Próximo passo salvo e missão em acompanhamento." });
        incrementStreak();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleResponse = async (kind: PersonResponseKind) => {
    startTransition(async () => {
      const result = await recordPersonResponse(currentPerson.id, kind);
      if (result.ok) {
        showCompletion(kind === "nao_quer_contato" ? "dnc_respected" : "response_recorded");
        const feedback = missionFeedback(kind);
        toast({ title: feedback.title, description: feedback.description });
        setShowResponseDialog(false);
        incrementStreak();
        const newQueue = queue.filter((p) => p.id !== currentPerson.id);
        setQueue(newQueue);
        if (currentIndex >= newQueue.length && newQueue.length > 0) {
          setCurrentIndex(newQueue.length - 1);
        }
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleReferral = async (type: PersonReferralType) => {
    startTransition(async () => {
      const result = await recordPersonReferral(currentPerson.id, type);
      if (result.ok) {
        showCompletion("referral_done");
        toast({ title: "Encaminhamento registrado.", description: "A missão ganhou um destino claro com histórico preservado." });
        setShowReferralDialog(false);
        incrementStreak();
        handleNext();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  if (queue.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="relative overflow-hidden rounded-[2px] border-2 border-black bg-charcoal p-8 text-white shadow-[6px_6px_0px_0px_rgba(242,169,0,0.3)]">
          <div className="absolute top-6 left-6 text-burnt-yellow/45 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="absolute bottom-6 right-6 text-burnt-yellow/45 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-charcoal border-2 border-burnt-yellow text-burnt-yellow shadow-lg shadow-burnt-yellow/20 animate-pulse">
              <Trophy className="h-10 w-10 text-burnt-yellow" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Trilha Concluída</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
              Quest Cumprida!
            </h2>
            <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-zinc-300">
              Sua fila de missões operacionais de hoje está completamente limpa. Cada contato e acolhimento feito mantém nossa chama de base aquecida e articulada!
            </p>

            <div className="mt-6 w-full rounded-[2px] border-2 border-cement bg-charcoal/60 p-4">
              <div className="flex flex-col items-center justify-around gap-4 sm:flex-row">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-burnt-yellow/10 border border-burnt-yellow/20 text-burnt-yellow">
                    <Flame className="h-5 w-5 fill-burnt-yellow/10 text-burnt-yellow" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Combo Ativo</p>
                    <p className="text-sm font-black text-white">x{streak} Conclusões</p>
                  </div>
                </div>

                <div className="h-px w-full bg-cement/30 sm:h-8 sm:w-px" />

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Estado da Trilha</p>
                    <p className="text-sm font-black text-emerald-400">100% Limpa e Segura</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                className="h-12 rounded-[2px] bg-burnt-yellow px-6 text-xs font-black uppercase tracking-wider text-charcoal border-2 border-black hover:bg-burnt-yellow/90 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] transition-all"
                nativeButton={false}
                render={<Link href="/abordagem?filter=sem_responsavel" />}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Assumir missões abertas
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-[2px] border-2 border-cement bg-charcoal text-xs font-black uppercase tracking-wider text-off-white hover:bg-cement/15 shadow-[3px_3px_0px_0px_rgba(11,11,11,0.5)] transition-all"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" /> Retornar à base
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPerson = queue[currentIndex];
  const currentMission = missionBySubjectId.get(currentPerson.id) ?? null;
  const nextFive = queue.slice(currentIndex + 1, currentIndex + 6);
  const phaseBadge = missionPhaseLabel(currentPerson);
  const holdTone = currentMission?.state === "BLOQUEADA"
    ? "blocked"
    : currentMission?.state === "EM_ESPERA"
      ? "waiting"
      : currentPerson.riskFlags.doNotContact
        ? "blocked"
        : currentPerson.riskFlags.recentOutreach || currentPerson.isPendingResponse
          ? "waiting"
          : "free";
  const currentBlocked = holdTone === "blocked" || Boolean(currentMission?.guardrail.blocksContact);
  const currentWaiting = holdTone === "waiting";
  const currentHoldLabel = currentMission?.guardrail.message
    || (currentBlocked
      ? currentPerson.doNotContactReason || "Restrição ética ativa."
      : currentWaiting
        ? currentPerson.riskFlags.recentOutreach
          ? "Contato recente. Aguarde a janela ética antes de insistir."
          : "Aguardando retorno da conversa já iniciada."
        : "Caminho livre. Sem bloqueio ativo agora.");
  const currentMissionType = currentMission ? missionTypeLabel(currentMission.type) : phaseBadge;
  const currentMissionState = currentMission ? missionStateLabel(currentMission.state) : currentWaiting ? "Em espera" : currentBlocked ? "Bloqueada" : "Em andamento";
  const currentMissionReason = currentMission?.reason || currentPerson.priorityReason;
  const currentMissionNextStep = currentMission?.nextStep || currentPerson.nextAction;
  const currentMissionAction = currentMission?.primaryAction.label || "Registrar avanço";
  const currentMissionSignals = currentMission?.signals ?? [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-32 lg:pb-20">
      {focusMode ? (
        /* ==================== IMMERSIVE MODE: HUD PILOTO AUTOMÁTICO ==================== */
        <div className="fixed inset-0 z-50 bg-[#0B0B0B] text-off-white p-4 md:p-8 flex flex-col justify-center overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-3xl w-full space-y-6">
            <div className="flex items-center justify-between border-b-2 border-cement/20 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow animate-pulse flex items-center gap-2">
                  <Flame className="h-4 w-4 fill-burnt-yellow animate-bounce" /> Piloto Automático • Modo Foco
                </span>
                <h1 className="text-lg font-black uppercase tracking-wider text-white">
                  Missão {currentIndex + 1} de {queue.length}
                </h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-2 border-white/20 text-white bg-transparent hover:bg-white/10 rounded-[2px] text-[10px] font-black uppercase"
                onClick={() => setFocusMode(false)}
              >
                Sair do foco
              </Button>
            </div>

            <div className="w-full h-2.5 border border-black bg-charcoal rounded-none overflow-hidden">
              <div
                className="h-full bg-burnt-yellow transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
              />
            </div>

            <QueueCard
              person={currentPerson}
              mission={currentMission}
              compact={true}
              contactDisabled={currentBlocked}
              onCopyDM={handleCopyDM}
              onRegisterResponse={() => setShowResponseDialog(true)}
              onReferral={() => setShowReferralDialog(true)}
              onSkip={handleSkip}
              onNext={handleNext}
              copyStatus={copyStatus}
              onConfirmSent={handleConfirmSent}
              onCancelCopy={() => setCopyStatus("idle")}
            />

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                className="text-xs font-black uppercase text-zinc-400 hover:text-white"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                Anterior
              </Button>
              <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Streak Ativo: <span className="text-burnt-yellow">x{streak} 🔥</span>
              </div>
              <Button
                variant="ghost"
                className="text-xs font-black uppercase text-zinc-400 hover:text-white"
                onClick={handleNext}
                disabled={currentIndex === queue.length - 1}
              >
                Avançar
              </Button>
            </div>

            <div className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic pt-4">
              &quot;Calma para organizar, não para aceitar.&quot;
            </div>
          </div>
        </div>
      ) : (
        /* ==================== STANDARD VIEW ==================== */
        <>
          <GamefulHero
            eyebrow="Jornada do operador"
            title="Minha Jornada"
            description={`Missão de hoje: ${currentMissionReason}`}
            variant="dark"
            compact={isCompact}
            titleClassName={cn("radar-title-display max-w-[8ch]", isCompact ? "text-[2.8rem] lg:text-[3.2rem] 2xl:text-6xl" : "text-4xl lg:text-5xl 2xl:text-6xl")}
            descriptionClassName={cn(isCompact ? "max-w-[28rem]" : "max-w-[32rem]")}
            metricsClassName={cn("sm:grid-cols-2", isCompact ? "2xl:grid-cols-4" : "xl:grid-cols-4")}
            badges={
              <>
                <GamefulHeroBadge>Fase atual: {missionPhaseLabel(currentPerson)}</GamefulHeroBadge>
                <GamefulHeroBadge className="border-[#f0c15b]/25 bg-[#f0c15b]/10 text-[#f7d88c]">Operador: {operatorName}</GamefulHeroBadge>
              </>
            }
            metrics={
              <>
                <GamefulMetricCard label="Fila" value={`${queue.length}`} tone="dark" detail="Missões abertas no dia." compact layout="split" />
                <GamefulMetricCard label="Progresso" value={`${progressPercent}%`} tone="dark" detail={`${completedCount} de ${queue.length} atravessadas`} compact layout="split" />
                <GamefulMetricCard label="Missão" value={currentMissionType} tone="dark" detail={currentMissionState} compact layout="split" valueClassName="max-w-[12ch]" />
                <GamefulMetricCard label="Carga" value={wellness.level === "healthy" ? "Estável" : wellness.level === "warning" ? "Bloco de 5" : "Pausa"} tone="dark" detail={wellness.level === "healthy" ? "Ritmo saudável." : wellness.level === "warning" ? "Feche um bloco curto." : "Pedir apoio ou redistribuir."} compact layout="split" title={wellness.microcopy} valueClassName="max-w-[11ch]" />
              </>
            }
            actions={
              <>
                <Button
                  className="h-12 bg-burnt-yellow text-charcoal border-2 border-black rounded-[2px] px-6 text-xs font-black uppercase tracking-wider hover:bg-burnt-yellow/90 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] transition-all animate-pulse"
                  onClick={() => {
                    setFocusMode(true);
                    trackOperationalEvent("focus_mode_activated");
                  }}
                >
                  <Flame className="mr-2 h-4 w-4 fill-charcoal text-charcoal" />
                  Iniciar Piloto Automático
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-2 border-black bg-white text-charcoal hover:bg-burnt-yellow rounded-[2px] shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] transition-all"
                  onClick={() => window.scrollTo({ top: isCompact ? 520 : 780, behavior: "smooth" })}
                >
                  <Compass className="mr-2 h-4 w-4" />
                  Continuar Trilha
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-2 border-black bg-white text-charcoal hover:bg-burnt-yellow rounded-[2px] shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] transition-all"
                  nativeButton={false}
                  render={<Link href="/abordagem" />}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Quadro de Missões
                </Button>
                {compactHydrated ? (
                  <CompactModeToggle enabled={manualCompact} autoCompact={isNotebookViewport || queue.length > 5} onToggle={setCompact} />
                ) : null}
              </>
            }
            aside={!isCompact ? (
              <div className="space-y-4 rounded-[2px] border-2 border-white bg-charcoal/45 p-4 xl:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Mapa da trilha</p>
                    <h3 className="mt-2 text-xl font-black text-white">
                      {currentPerson.displayName || `@${currentPerson.username}`}
                    </h3>
                  </div>
                  <Sparkles className="h-5 w-5 text-burnt-yellow" />
                </div>
                <p className="text-xs font-semibold leading-relaxed text-zinc-300">{currentPerson.priorityReason}</p>
                <div className="rounded-[2px] border-2 border-white/20 bg-black/45 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Próximo passo</p>
                  <p className="mt-2 text-sm font-black text-white">{currentMissionNextStep}</p>
                </div>
                <div className="space-y-3">
                  {nextFive.map((person, idx) => (
                    <div key={person.id} className="flex items-center justify-between gap-3 rounded-[2px] border border-white/10 bg-black/20 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">
                          {idx + 2}. {person.displayName || `@${person.username}`}
                        </p>
                        <p className="truncate text-xs font-medium text-zinc-400">{person.nextAction}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          />

          <OperationalCommandBar
            title="Barra de comando"
            statusLabel="Missão em foco"
            statusValue={`${currentMissionType} · ${currentMissionState}`}
            statusDetail={currentHoldLabel}
            primaryAction={{
              label: currentMissionAction,
              onClick: currentBlocked ? handleSkip : () => setShowResponseDialog(true),
              icon: MessageSquare,
            }}
            secondaryActions={[
              {
                label: "Abrir Instagram",
                onClick: () => window.open(currentPerson.instagramUrl || `https://instagram.com/${currentPerson.username}`, "_blank"),
                icon: Instagram,
                disabled: currentBlocked,
                title: currentBlocked ? "Ação de contato indisponível enquanto a missão estiver bloqueada." : undefined,
              },
              {
                label: "Preparar Mensagem",
                onClick: handleCopyDM,
                icon: Copy,
                disabled: !currentPerson.suggestedMessage || currentBlocked,
                title: currentBlocked ? "Ação de contato indisponível enquanto a missão estiver bloqueada." : undefined,
              },
              {
                label: "Próxima Missão",
                onClick: handleNext,
                icon: ChevronRight,
                disabled: currentIndex === queue.length - 1,
              },
            ]}
            shortcutAction={{
              label: "Abrir Central de Ritmo",
              href: "/ritmo",
              icon: TowerControl,
            }}
          />

          {wellness.level !== "healthy" && !isCompact && <OperatorWellnessCard wellness={wellness} />}

          <div className={cn("grid gap-8", isCompact ? "2xl:grid-cols-[1.3fr_0.7fr]" : "xl:grid-cols-[1.3fr_0.7fr]")}>
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Próxima missão</p>
                  <h3 className="text-2xl font-black tracking-tight text-charcoal">Continuar Jornada</h3>
                  <p className="max-w-2xl text-xs font-semibold text-cement">
                    A pessoa em foco, a missão explicável e o próximo passo aparecem primeiro. O restante da trilha entra como apoio.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {streak > 0 && (
                    <div className="flex items-center gap-1.5 bg-burnt-yellow/10 text-charcoal rounded-full px-3 py-1 text-xs font-black border border-burnt-yellow animate-pulse">
                      <Flame className="h-4 w-4 fill-burnt-yellow text-charcoal animate-bounce" />
                      <span>Combo x{streak}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    className="text-xs font-black uppercase tracking-wider text-cement hover:text-charcoal"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                  >
                    Anterior
                  </Button>
                  <div className="h-3 w-24 overflow-hidden rounded-none border border-black bg-white sm:w-32 xl:w-40">
                    <div
                      className="h-full bg-burnt-yellow transition-all duration-500"
                      style={{ width: `${Math.max(6, ((currentIndex + 1) / queue.length) * 100)}%` }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    className="text-xs font-black uppercase tracking-wider text-cement hover:text-charcoal"
                    onClick={handleNext}
                    disabled={currentIndex === queue.length - 1}
                  >
                    Próxima
                  </Button>
                </div>
              </div>

              <QueueCard
                person={currentPerson}
                mission={currentMission}
                compact={isCompact}
                contactDisabled={currentBlocked}
                onCopyDM={handleCopyDM}
                onRegisterResponse={() => setShowResponseDialog(true)}
                onReferral={() => setShowReferralDialog(true)}
                onSkip={handleSkip}
                onNext={handleNext}
                copyStatus={copyStatus}
                onConfirmSent={handleConfirmSent}
                onCancelCopy={() => setCopyStatus("idle")}
              />

              {isCompact ? (
                <details className="radar-outline-card rounded-[2px] border-2 border-black bg-white">
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-charcoal">
                    Abrir leitura complementar da jornada
                  </summary>
                  <div className="space-y-4 border-t-2 border-black px-5 py-4">
                    <div className="space-y-3 rounded-[2px] border-2 border-black bg-white/75 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Mapa da trilha</p>
                          <h4 className="mt-1 text-lg font-black text-charcoal">
                            {currentPerson.displayName || `@${currentPerson.username}`}
                          </h4>
                        </div>
                        <MapPinned className="h-4 w-4 text-cement" />
                      </div>
                      <p className="text-xs font-semibold leading-relaxed text-charcoal">{currentPerson.priorityReason}</p>
                      <div className="rounded-[2px] border-2 border-black bg-charcoal/5 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Próximo passo</p>
                        <p className="mt-1 text-xs font-black text-charcoal">{currentPerson.nextAction}</p>
                      </div>
                    </div>
                    {wellness.level !== "healthy" ? <OperatorWellnessCard wellness={wellness} /> : null}
                  </div>
                </details>
              ) : null}
            </div>

            <aside className="space-y-6">
              {isCompact ? (
                <QueueList tasks={queue} currentIndex={currentIndex} onSelect={setCurrentIndex} compact />
              ) : null}
              {recommendedMissions.length > 0 ? (
                <Card className="bloco-concreto relative overflow-hidden py-0">
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Bloco recomendado</p>
                      <h4 className="text-lg font-black text-charcoal">Próximas 5 missões da engine</h4>
                      <p className="text-xs leading-relaxed text-cement">
                        Ajuste o foco do turno sem perder a trilha. O bloco equilibra cuidado, retorno, escuta e encaminhamento.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {WORK_MODE_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={cn(
                            "rounded-[2px] border-2 px-4 py-3 text-left transition-all",
                            workMode === option.id
                              ? "border-black bg-burnt-yellow shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                              : "border-black bg-white hover:bg-burnt-yellow/10",
                          )}
                          onClick={() => setWorkMode(option.id)}
                        >
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-charcoal">{option.label}</p>
                          <p className="mt-1 text-[10px] leading-relaxed text-cement">{option.hint}</p>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {recommendedMissions.map((mission) => (
                        <button
                          key={mission.id}
                          type="button"
                          className="w-full rounded-[2px] border-2 border-black bg-white p-4 text-left transition-all hover:bg-burnt-yellow shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                          onClick={() => {
                            const targetIndex = mission.subjectId ? queue.findIndex((person) => person.id === mission.subjectId) : -1;
                            if (targetIndex >= 0) {
                              setCurrentIndex(targetIndex);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">
                                {missionTypeLabel(mission.type)} · {missionStateLabel(mission.state)}
                              </p>
                              <p className="mt-1 text-sm font-black text-charcoal">{mission.title}</p>
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-cement">{mission.nextStep}</p>
                            </div>
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-charcoal" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
              <Card className="bloco-concreto relative overflow-hidden py-0">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-2 text-charcoal">
                    <TowerControl className="h-4 w-4 text-cement" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">
                      Cuidado e ritmo
                    </h4>
                  </div>
                  <div className="grid gap-3">
                    <WellbeingLine
                      icon={Coffee}
                      title={wellness.level === "healthy" ? "Carga saudável" : "Trabalhe em blocos curtos"}
                      description={wellness.recommendation}
                    />
                    {queue.length > 5 ? (
                      <WellbeingLine
                        icon={PauseCircle}
                        title="Bloco sugerido de 5 missões"
                        description="Feche um grupo curto, revise o estado da base e só então abra o próximo bloco."
                      />
                    ) : null}
                    {wellness.shouldSuggestBreak ? (
                      <WellbeingLine
                        icon={HeartHandshake}
                        title="Pausa recomendada"
                        description="Ao concluir este bloco, faça uma pausa antes de abrir mais conversas."
                      />
                    ) : null}
                    {wellness.level !== "healthy" ? (
                      <Button
                        variant="outline"
                        className="h-11 border-2 border-black bg-white rounded-[2px] text-xs font-black uppercase tracking-wider hover:bg-burnt-yellow"
                        nativeButton={false}
                        render={<Link href="/abordagem?filter=sem_responsavel" />}
                      >
                        Redistribuir com coordenação
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <EthicalGuardrailBanner
                description="Toda conversa é manual, contextual e revisada por quem envia. Nenhuma missão autoriza spam, automação de DM ou pedido direto de voto."
                badgeLabel="Operação humana"
              />

              {oldPendencies.length > 0 && (
                <Card className="bloco-concreto relative overflow-hidden py-0 border-burnt-yellow">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Pendências antigas</p>
                        <h4 className="mt-1 text-lg font-black text-charcoal">
                          {oldPendencies.length} missões pedem revisão
                        </h4>
                      </div>
                      <Badge variant="outline" className="border-2 border-black bg-white text-charcoal rounded-[2px]">
                        3+ dias
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {oldPendencies.slice(0, 4).map((person) => (
                        <button
                          key={person.id}
                          className="w-full rounded-[2px] border-2 border-black bg-white p-4 text-left transition-all hover:bg-burnt-yellow shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                          onClick={() => {
                            setQueue((prev) => [person, ...prev.filter((p) => p.id !== person.id)]);
                            setCurrentIndex(0);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <p className="text-sm font-black text-charcoal">
                            {person.displayName || `@${person.username}`}
                          </p>
                          <p className="mt-1 text-xs font-medium text-cement">
                            Revisar espera prolongada e decidir se a trilha segue ou fecha.
                          </p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>

          <section className={cn("grid gap-6", isCompact ? "2xl:grid-cols-[1.1fr_0.9fr]" : "xl:grid-cols-[1.1fr_0.9fr]")}>
            <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
              <CardContent className="grid gap-5 p-5 sm:p-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-charcoal">
                    <Route className="h-5 w-5" />
                    <h3 className="text-2xl font-black tracking-tight">Leitura da missão</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-[2px] border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-charcoal">
                      {currentMissionType}
                    </Badge>
                    {currentBlocked ? (
                      <Badge className="rounded-[2px] border-2 border-rust bg-rust/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-rust">
                        {currentMissionState}
                      </Badge>
                    ) : currentWaiting ? (
                      <Badge className="rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-dark-yellow">
                        {currentMissionState}
                      </Badge>
                    ) : (
                      <Badge className="rounded-[2px] border-2 border-moss bg-moss/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-moss">
                        {currentMissionState}
                      </Badge>
                    )}
                    <Badge className="rounded-[2px] border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-charcoal">
                      {currentMission ? currentMission.phase : phaseBadge}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tight text-charcoal">
                      {currentPerson.displayName || `@${currentPerson.username}`}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-cement">@{currentPerson.username}</p>
                  </div>
                  <div className="grid gap-3">
                    <MissionPanel label="Motivo" value={currentMissionReason} />
                    <MissionPanel label="Próximo passo" value={currentMissionNextStep} compact />
                    <MissionPanel label={holdTone === "free" ? "Guardrail" : "Bloqueio ou espera"} value={currentHoldLabel} tone={holdTone} />
                    {currentMissionSignals.length > 0 ? (
                      <div className="rounded-[2px] border-2 border-black bg-white/70 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Sinais usados</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {currentMissionSignals.slice(0, 4).map((signal) => (
                            <Badge
                              key={`${signal.code}-${signal.at ?? signal.label}`}
                              className="rounded-[2px] border border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-charcoal hover:bg-white"
                            >
                              {signal.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 rounded-[2px] border-2 border-black bg-charcoal/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Ação recomendada</p>
                      <p className="mt-1 text-sm font-black text-charcoal">{currentMissionAction}</p>
                    </div>
                    <Sparkles className="h-4 w-4 text-burnt-yellow" />
                  </div>
                  <div className="rounded-[2px] border border-black bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Próximo passo salvo</p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-charcoal">{currentMissionNextStep}</p>
                  </div>
                  <div className="min-h-[140px] rounded-[2px] border border-black bg-white p-4 text-sm font-medium leading-relaxed text-charcoal">
                    {currentPerson.suggestedMessage || "Nenhum modelo ideal encontrado para este contexto. Revise a ficha e siga com abordagem manual."}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      className="h-11 bg-charcoal text-off-white text-xs font-black uppercase tracking-wider hover:bg-concrete-dark rounded-[2px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                      Continuar Jornada
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 border-2 border-black bg-white text-charcoal text-xs font-black uppercase tracking-wider hover:bg-burnt-yellow rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                      onClick={handleCopyDM}
                      disabled={!currentPerson.suggestedMessage || currentBlocked}
                    >
                      {currentBlocked ? "Contato indisponível" : "Preparar mensagem"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-charcoal">
                  <MapPinned className="h-5 w-5" />
                  <h3 className="text-2xl font-black tracking-tight">Trilha das próximas missões</h3>
                </div>
                <p className="text-xs leading-relaxed text-cement font-semibold">
                  As próximas cinco aparecem como caminho imediato da jornada. O foco continua em uma pessoa por vez, sem virar fila infinita.
                </p>
                {!isCompact ? <QueueList tasks={queue} currentIndex={currentIndex} onSelect={setCurrentIndex} /> : null}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* ==================== SHARED DIALOGS ==================== */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="overflow-hidden border-2 border-black rounded-[2px] p-0 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bg-white sm:max-w-[540px]">
          <div className="bg-charcoal p-6 text-white rounded-t-[2px]">
            <DialogTitle className="text-xl font-black uppercase">Registrar avanço da missão</DialogTitle>
            <DialogDescription className="font-bold text-zinc-400">
              O que aconteceu na conversa com @{currentPerson.username}?
            </DialogDescription>
          </div>
          <div className="grid gap-3 p-6 max-h-[70vh] overflow-y-auto">
            {RESPONSE_OPTIONS.map((option) => (
              <button
                key={option.id}
                disabled={isPending}
                className={cn(
                  "w-full rounded-[2px] border-2 border-black p-4 text-left transition-all hover:bg-burnt-yellow hover:text-charcoal bg-white text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]",
                  isPending && "cursor-not-allowed opacity-50",
                )}
                onClick={() => handleResponse(option.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-[2px] border border-black bg-charcoal/5 p-2 text-charcoal">
                    <option.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider">{option.label}</p>
                    <p className="mt-1 text-xs font-semibold text-cement leading-normal">{option.hint}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="overflow-hidden border-2 border-black rounded-[2px] p-0 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bg-white sm:max-w-[560px]">
          <div className="bg-charcoal p-6 text-white rounded-t-[2px]">
            <DialogTitle className="text-xl font-black uppercase">Definir próximo destino</DialogTitle>
            <DialogDescription className="font-bold text-zinc-400">
              Escolha qual missão ou encaminhamento continua o ciclo de @{currentPerson.username}.
            </DialogDescription>
          </div>
          <div className="grid gap-3 p-6 max-h-[70vh] overflow-y-auto">
            {REFERRAL_OPTIONS.map((option) => (
              <button
                key={option.id}
                disabled={isPending}
                className={cn(
                  "w-full rounded-[2px] border-2 border-black p-4 text-left transition-all hover:bg-burnt-yellow hover:text-charcoal bg-white text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]",
                  isPending && "cursor-not-allowed opacity-50",
                )}
                onClick={() => handleReferral(option.id)}
              >
                <p className="text-sm font-black uppercase tracking-wider">{option.label}</p>
                <p className="mt-1 text-xs font-semibold text-cement leading-normal">{option.hint}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MissionPanel({
  label,
  value,
  compact,
  tone = "neutral",
}: {
  label: string;
  value: string;
  compact?: boolean;
  tone?: "neutral" | "blocked" | "waiting" | "free";
}) {
  const isBlocked = tone === "blocked";
  const isWaiting = tone === "waiting";
  const isFree = tone === "free";

  return (
    <div
      className={cn(
        "rounded-[2px] border-2 p-4",
        isBlocked
          ? "border-rust bg-rust/5 text-rust"
          : isWaiting
            ? "border-burnt-yellow bg-burnt-yellow/10 text-dark-yellow"
            : isFree
              ? "border-moss bg-moss/5 text-moss"
              : "border-black bg-white text-charcoal",
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.24em] mb-1.5 leading-none">{label}</p>
      <p
        className={cn(
          "leading-relaxed font-semibold",
          compact
            ? "text-xs font-black text-charcoal"
            : "text-xs",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function WellbeingLine({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Coffee;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2px] border-2 border-black bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[2px] border-2 border-black bg-charcoal/5 text-charcoal">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-charcoal">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-cement">{description}</p>
        </div>
      </div>
    </div>
  );
}
