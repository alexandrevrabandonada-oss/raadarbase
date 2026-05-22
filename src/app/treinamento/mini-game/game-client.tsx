"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  Flame,
  Instagram,
  Lock,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkle,
  UserCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  playSynthConfirm,
  playSynthKeypress,
  playSynthSkip,
  playSynthSuccess,
  playSynthZen,
} from "@/lib/audio";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  MINI_GAME_COMPETENCY_KINDS,
  writeMiniGameTrainingResult,
} from "@/lib/training-mini-game-result";
import {
  ActionButton,
  ConsequencePanel,
  ConversationSimulator,
  MissionHoldPanel,
  MissionMemoryPreview,
  MissionReceipt,
  MobileMetric,
  StepResolution,
} from "./game-components";
import {
  MISSIONS,
  STEP_LABELS,
  STEP_ORDER,
  type CorrectionKind,
  type Consequence,
  type Mission,
  type MissionHold,
  type MissionResult,
  type MissionStep,
} from "./game-data";

type ScreenState = "intro" | "mission" | "victory";
type CheckpointScreen = Exclude<ScreenState, "intro">;

interface GameCheckpoint {
  combo: number;
  completedRoute: Mission["routeOptions"][number] | null;
  completedSteps: MissionStep[];
  concretoScore: number;
  consequence: Consequence;
  draftMessage: string;
  feedback: string;
  hold: MissionHold;
  log: string[];
  missionCorrections: number;
  missionCorrectionKinds: CorrectionKind[];
  missionIndex: number;
  missionResults: MissionResult[];
  registeredResponse: string | null;
  screen: CheckpointScreen;
  step: MissionStep;
  version: 2;
  zenScore: number;
}

const CHECKPOINT_KEY = "radar_mini_game_checkpoint_v2";

const REVIEW_CUES: Record<CorrectionKind, { title: string; message: string }> = {
  automation: {
    title: "Revisar abordagem manual",
    message: "Evite tratar a conversa como disparo. O canal serve para escuta contextual e confirmacao humana.",
  },
  personalization: {
    title: "Revisar personalizacao",
    message: "Antes de confirmar envio, adapte o modelo para o sinal e a voz da pessoa abordada.",
  },
  privacy: {
    title: "Revisar privacidade",
    message: "Quando a pessoa pede limite de contato, o fluxo precisa proteger esse pedido antes de encaminhar.",
  },
  response: {
    title: "Revisar registro da resposta",
    message: "Leia o retorno recebido e classifique o estado real da conversa antes de mover a missao.",
  },
  routing: {
    title: "Revisar destino da missao",
    message: "A rota final deve preservar ritmo e contexto para o proximo operador.",
  },
};

const COMPETENCY_CUES: Record<CorrectionKind, { label: string; mastered: string }> = {
  automation: {
    label: "Abordagem manual",
    mastered: "Evita tratar conversa como disparo.",
  },
  personalization: {
    label: "Personalizacao",
    mastered: "Revê o modelo antes de confirmar envio.",
  },
  privacy: {
    label: "Privacidade",
    mastered: "Protege limites de contato e bloqueios.",
  },
  response: {
    label: "Registro do retorno",
    mastered: "Classifica a resposta antes de mover a missao.",
  },
  routing: {
    label: "Encaminhamento",
    mastered: "Escolhe destino com contexto preservado.",
  },
};

const COMPETENCY_ORDER = MINI_GAME_COMPETENCY_KINDS;

function getInitialLog(mission: Mission) {
  return [
    `Sinal recebido: ${mission.source}`,
    `Objetivo: ${mission.objective}`,
  ];
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function routeIcon(icon: Mission["routeOptions"][number]["icon"]) {
  if (icon === "shield") return ShieldAlert;
  if (icon === "wait") return Lock;
  return UserCheck;
}

function channelIcon(channel: Mission["channel"]) {
  if (channel === "field-note") return ClipboardCheck;
  if (channel === "form") return FileText;
  return Instagram;
}

function getClearConsequence(mission: Mission): Consequence {
  return {
    eyebrow: "Estado da missao",
    label: "Caminho livre",
    message: mission.objective,
    tone: "clear",
  };
}

function getFreeHold(mission: Mission): MissionHold {
  return {
    label: "Em andamento",
    message: `${mission.objective} Caminho livre. Sem bloqueio ativo agora.`,
    tone: "free",
  };
}

function getRouteHold(route: Mission["routeOptions"][number]): MissionHold {
  if (route.icon === "shield") {
    return {
      label: "Bloqueada",
      message: "Restricao etica salva. O contato fica indisponivel para nova abordagem.",
      tone: "blocked",
    };
  }

  if (route.icon === "wait") {
    return {
      label: "Em espera",
      message: "A decisao foi pausada. A equipe aguarda contexto antes de insistir.",
      tone: "waiting",
    };
  }

  return {
    label: "Encaminhada",
    message: "Caminho livre para a proxima equipe agir com o contexto registrado.",
    tone: "free",
  };
}

function buildMissionMemory(
  mission: Mission,
  registeredResponse: string | null,
  routeLabel?: string,
) {
  const response = registeredResponse ? `Resposta: ${registeredResponse}.` : "Resposta ainda sem classificacao.";
  const route = routeLabel ? `Destino: ${routeLabel}.` : "Destino aguardando definicao.";

  return `${mission.handoffNote} ${response} ${route}`;
}

function readCheckpoint() {
  try {
    const checkpoint = JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || "null") as Partial<GameCheckpoint> | null;
    if (
      !checkpoint
      || checkpoint.version !== 2
      || !Number.isInteger(checkpoint.missionIndex)
      || checkpoint.missionIndex === undefined
      || checkpoint.missionIndex < 0
      || checkpoint.missionIndex >= MISSIONS.length
      || !checkpoint.step
      || !STEP_ORDER.includes(checkpoint.step)
    ) {
      return null;
    }

    return checkpoint as GameCheckpoint;
  } catch {
    return null;
  }
}

export default function GameClient() {
  const [screen, setScreen] = useState<ScreenState>("intro");
  const [missionIndex, setMissionIndex] = useState(0);
  const [step, setStep] = useState<MissionStep>("copy");
  const [completedSteps, setCompletedSteps] = useState<MissionStep[]>([]);
  const [concretoScore, setConcretoScore] = useState(0);
  const [zenScore, setZenScore] = useState(65);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("Siga o fluxo real: prepare, abra, personalize, confirme, registre e encaminhe.");
  const [log, setLog] = useState<string[]>(() => getInitialLog(MISSIONS[0]));
  const [draftMessage, setDraftMessage] = useState(MISSIONS[0].suggestedMessage);
  const [consequence, setConsequence] = useState<Consequence>(() => getClearConsequence(MISSIONS[0]));
  const [hold, setHold] = useState<MissionHold>(() => getFreeHold(MISSIONS[0]));
  const [registeredResponse, setRegisteredResponse] = useState<string | null>(null);
  const [completedRoute, setCompletedRoute] = useState<Mission["routeOptions"][number] | null>(null);
  const [showResponseDecision, setShowResponseDecision] = useState(false);
  const [showRouteDecision, setShowRouteDecision] = useState(false);
  const [missionCorrections, setMissionCorrections] = useState(0);
  const [missionCorrectionKinds, setMissionCorrectionKinds] = useState<CorrectionKind[]>([]);
  const [missionResults, setMissionResults] = useState<MissionResult[]>([]);
  const [savedCheckpoint, setSavedCheckpoint] = useState<GameCheckpoint | null>(null);
  const [checkpointReady, setCheckpointReady] = useState(false);
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("radar_audio_muted") === "true";
  });

  const mission = MISSIONS[missionIndex];
  const guidedMission = mission.supportLevel === "guided";
  const operationMission = mission.supportLevel === "operation";
  const progressValue = useMemo(
    () => ((missionIndex * STEP_ORDER.length + completedSteps.length) / (MISSIONS.length * STEP_ORDER.length)) * 100,
    [completedSteps.length, missionIndex],
  );
  const totalCorrections = missionResults.reduce((total, result) => total + result.corrections, 0);
  const cleanMissions = missionResults.filter((result) => result.corrections === 0).length;
  const reviewKinds = Array.from(new Set(missionResults.flatMap((result) => result.correctionKinds)));
  const firstReviewMission = missionResults.find((result) => result.correctionKinds.length > 0);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setSavedCheckpoint(readCheckpoint());
      setCheckpointReady(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!checkpointReady || screen === "intro") return;

    const checkpoint: GameCheckpoint = {
      combo,
      completedRoute,
      completedSteps,
      concretoScore,
      consequence,
      draftMessage,
      feedback,
      hold,
      log,
      missionCorrections,
      missionCorrectionKinds,
      missionIndex,
      missionResults,
      registeredResponse,
      screen,
      step,
      version: 2,
      zenScore,
    };

    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));
  }, [
    checkpointReady,
    combo,
    completedRoute,
    completedSteps,
    concretoScore,
    consequence,
    draftMessage,
    feedback,
    hold,
    log,
    missionCorrections,
    missionCorrectionKinds,
    missionIndex,
    missionResults,
    registeredResponse,
    screen,
    step,
    zenScore,
  ]);

  const play = (kind: "confirm" | "keypress" | "skip" | "success" | "zen") => {
    if (muted) return;
    if (kind === "confirm") playSynthConfirm();
    if (kind === "keypress") playSynthKeypress();
    if (kind === "skip") playSynthSkip();
    if (kind === "success") playSynthSuccess();
    if (kind === "zen") playSynthZen();
  };

  const resetMissionState = (nextMissionIndex: number) => {
    const nextMission = MISSIONS[nextMissionIndex];
    setStep("copy");
    setCompletedSteps([]);
    setFeedback("Siga o fluxo real: prepare, abra, personalize, confirme, registre e encaminhe.");
    setLog(getInitialLog(nextMission));
    setDraftMessage(nextMission.suggestedMessage);
    setConsequence(getClearConsequence(nextMission));
    setHold(getFreeHold(nextMission));
    setRegisteredResponse(null);
    setCompletedRoute(null);
    setShowResponseDecision(false);
    setShowRouteDecision(false);
    setMissionCorrections(0);
    setMissionCorrectionKinds([]);
  };

  const startGame = () => {
    play("confirm");
    localStorage.removeItem(CHECKPOINT_KEY);
    setSavedCheckpoint(null);
    setMissionIndex(0);
    setConcretoScore(0);
    setZenScore(65);
    setCombo(0);
    setMissionResults([]);
    resetMissionState(0);
    setScreen("mission");
  };

  const restartAtMission = (nextMissionIndex: number) => {
    play("confirm");
    localStorage.removeItem(CHECKPOINT_KEY);
    setSavedCheckpoint(null);
    setMissionIndex(nextMissionIndex);
    setConcretoScore(0);
    setZenScore(65);
    setCombo(0);
    setMissionResults([]);
    resetMissionState(nextMissionIndex);
    setScreen("mission");
  };

  const resumeGame = (checkpoint: GameCheckpoint) => {
    play("confirm");
    setMissionIndex(checkpoint.missionIndex);
    setStep(checkpoint.step);
    setCompletedSteps(checkpoint.completedSteps);
    setConcretoScore(checkpoint.concretoScore);
    setZenScore(checkpoint.zenScore);
    setCombo(checkpoint.combo);
    setFeedback(checkpoint.feedback);
    setLog(checkpoint.log);
    setDraftMessage(checkpoint.draftMessage);
    setConsequence(checkpoint.consequence);
    setHold(checkpoint.hold || getFreeHold(MISSIONS[checkpoint.missionIndex]));
    setRegisteredResponse(checkpoint.registeredResponse);
    setCompletedRoute(checkpoint.completedRoute);
    setMissionCorrections(checkpoint.missionCorrections);
    setMissionCorrectionKinds(checkpoint.missionCorrectionKinds);
    setMissionResults(checkpoint.missionResults);
    setScreen(checkpoint.screen);
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    localStorage.setItem("radar_audio_muted", String(nextMuted));
    if (!nextMuted) playSynthConfirm();
  };

  const completeStep = (currentStep: MissionStep, message: string) => {
    if (step !== currentStep) return;
    play("keypress");
    setCompletedSteps((previous) => [...previous, currentStep]);
    const nextStep = STEP_ORDER[STEP_ORDER.indexOf(currentStep) + 1];
    if (nextStep) setStep(nextStep);
    setConcretoScore((value) => value + 8);
    setFeedback(message);
    setLog((previous) => [`${STEP_LABELS[currentStep]} concluido.`, ...previous].slice(0, 6));
  };

  const confirmPersonalization = () => {
    if (step !== "personalize") return;
    const trimmedMessage = draftMessage.trim();
    const changedMessage = trimmedMessage !== mission.suggestedMessage.trim();

    if (trimmedMessage.length < 60 || !changedMessage) {
      play("skip");
      setCombo(0);
      setZenScore((value) => clamp(value - 8));
      setMissionCorrections((value) => value + 1);
      setMissionCorrectionKinds((value) => [...value, "personalization"]);
      setFeedback("Personalize antes de enviar: preserve o contexto e acrescente sua voz manual.");
      setLog((previous) => ["Personalizacao pendente: o texto ainda esta igual ao modelo.", ...previous].slice(0, 6));
      setConsequence({
        eyebrow: "Atencao no envio",
        label: "Modelo sem voz manual",
        message: "Enviar o texto cru enfraquece a escuta e aproxima a abordagem de automacao.",
        tone: "warning",
      });
      return;
    }

    play("success");
    setCompletedSteps((previous) => [...previous, "personalize"]);
    setStep("send");
    setConcretoScore((value) => value + 12);
    setZenScore((value) => clamp(value + 8));
    setFeedback("Texto personalizado. Agora confirme apenas o envio manual feito no canal.");
    setLog((previous) => ["Mensagem personalizada antes do envio.", ...previous].slice(0, 6));
    setConsequence({
      eyebrow: "Estado da abordagem",
      label: "Mensagem contextualizada",
      message: "O envio ficou pronto para confirmacao manual no canal real.",
      tone: "clear",
    });
  };

  const chooseResponse = (option: Mission["responseOptions"][number]) => {
    if (step !== "response") return;
    setShowResponseDecision(false);
    if (option.correct) {
      play("success");
      setCompletedSteps((previous) => [...previous, "response"]);
      setStep("route");
      setCombo((value) => value + 1);
      setConcretoScore((value) => value + 18);
      setZenScore((value) => clamp(value + 10));
      setFeedback(option.feedback);
      setLog((previous) => [`Resposta registrada: ${option.label}.`, ...previous].slice(0, 6));
      setRegisteredResponse(option.label);
      setConsequence({
        eyebrow: "Registro protegido",
        label: "Resposta classificada",
        message: "A proxima acao agora depende da rota correta para esta conversa.",
        tone: "clear",
      });
      setHold(getFreeHold(mission));
      return;
    }

    play("skip");
    setCombo(0);
    setConcretoScore((value) => Math.max(0, value - 5));
    setZenScore((value) => clamp(value - 15));
    setMissionCorrections((value) => value + 1);
    setMissionCorrectionKinds((value) => [...value, option.id === "blast" ? "automation" : "response"]);
    setFeedback(option.feedback);
    setLog((previous) => [`Tentativa recusada: ${option.label}.`, ...previous].slice(0, 6));
    setConsequence({
      eyebrow: option.id === "blast" ? "Guardrail etico" : "Risco de registro",
      label: option.id === "blast" ? "Automacao indevida" : "Contexto mal classificado",
      message: option.feedback,
      tone: option.id === "blast" ? "guardrail" : "warning",
    });
    setHold(option.id === "cold" || option.id === "closed" || option.id === "ignore"
      ? {
          label: "Em espera",
          message: "Sem retorno real, a conversa fica em espera e nao deve ser encaminhada como abertura confirmada.",
          tone: "waiting",
        }
      : getFreeHold(mission));
  };

  const chooseRoute = (option: Mission["routeOptions"][number]) => {
    if (step !== "route") return;
    setShowRouteDecision(false);
    if (!option.correct) {
      play("skip");
      setCombo(0);
      setZenScore((value) => clamp(value - 12));
      setMissionCorrections((value) => value + 1);
      setMissionCorrectionKinds((value) => [
        ...value,
        option.icon === "shield" || missionIndex === 1 ? "privacy" : "routing",
      ]);
      setFeedback(option.feedback);
      setLog((previous) => [`Rota corrigida: ${option.label}.`, ...previous].slice(0, 6));
      setConsequence({
        eyebrow: option.icon === "shield" || missionIndex === 1 ? "Guardrail etico" : "Risco de fluxo",
        label: option.icon === "wait" ? "Missao parada sem motivo" : "Encaminhamento incorreto",
        message: option.feedback,
        tone: option.icon === "shield" || missionIndex === 1 ? "guardrail" : "warning",
      });
      setHold(getRouteHold(option));
      return;
    }

    play("success");
    setCompletedSteps((previous) => [...previous, "route"]);
    setConcretoScore((value) => value + 25);
    setZenScore((value) => clamp(value + 8));
    setCombo((value) => value + 1);
    setFeedback(option.feedback);
    setLog((previous) => [`Missao finalizada: ${option.label}.`, ...previous].slice(0, 6));
    setCompletedRoute(option);
    setMissionResults((previous) => [
      ...previous,
      {
        contact: mission.contact,
        corrections: missionCorrections,
        correctionKinds: missionCorrectionKinds,
        memory: buildMissionMemory(mission, registeredResponse, option.label),
        missionIndex,
        response: registeredResponse || "Registro pendente",
        route: option.label,
      },
    ]);
    setConsequence({
      eyebrow: "Missao concluida",
      label: option.label,
      message: option.feedback,
      tone: "clear",
    });
    setHold(getRouteHold(option));

  };

  const continueAfterReceipt = () => {
    play("confirm");
    if (missionIndex === MISSIONS.length - 1) {
      play("zen");
      writeMiniGameTrainingResult({
        cleanMissions,
        completedAt: new Date().toISOString(),
        masteredKinds: COMPETENCY_ORDER.filter((kind) => !reviewKinds.includes(kind)),
        reviewKinds,
        totalCorrections,
        version: 1,
      });
      setScreen("victory");
      return;
    }

    const nextIndex = missionIndex + 1;
    setMissionIndex(nextIndex);
    resetMissionState(nextIndex);
  };

  const currentStepIndex = STEP_ORDER.indexOf(step);
  const ChannelIcon = channelIcon(mission.channel);
  const missionMemory = buildMissionMemory(mission, registeredResponse, completedRoute?.label);

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-charcoal dark:bg-[#121210] dark:text-off-white">
      <header className="border-b-4 border-charcoal bg-burnt-yellow p-4 shadow-[0_4px_0_0_rgba(26,26,26,1)] dark:border-cement dark:bg-concrete-dark dark:shadow-[0_4px_0_0_rgba(150,150,150,0.3)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkle className="h-6 w-6" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em]">Treinamento operacional</p>
              <h1 className="text-sm font-black uppercase tracking-widest md:text-base">Mini-game do fluxo real</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            className="flex h-10 w-10 items-center justify-center rounded-[2px] border-2 border-charcoal bg-off-white text-charcoal shadow-[2px_2px_0_0_rgba(26,26,26,1)] transition active:translate-y-0.5 active:shadow-none"
            aria-label={muted ? "Ativar audio do mini-game" : "Mutar audio do mini-game"}
            title={muted ? "Desmutar audio" : "Mutar audio"}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
        {screen === "intro" && (
          <section className="grid min-h-[70vh] items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="inline-flex border-2 border-charcoal bg-off-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] shadow-[3px_3px_0_0_rgba(26,26,26,1)]">
                Base de operacoes // treino de campo
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-normal md:text-6xl">
                  Aprenda clicando no fluxo do app
                </h2>
                <p className="max-w-2xl text-base font-semibold leading-relaxed text-charcoal/75 dark:text-off-white/75">
                  A jornada agora simula os botoes reais: preparar mensagem, abrir canal, confirmar envio,
                  registrar resposta e encaminhar a missao. Entre eles, voce personaliza a abordagem manual.
                </p>
              </div>
              {savedCheckpoint && (
                <div className="border-2 border-charcoal bg-off-white p-4 shadow-[4px_4px_0_0_rgba(26,26,26,0.24)] dark:border-cement dark:bg-[#1E1E1B]">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Checkpoint local</p>
                  <p className="mt-2 text-sm font-black uppercase">
                    {savedCheckpoint.screen === "victory"
                      ? "Trilha concluida salva"
                      : `Missao ${savedCheckpoint.missionIndex + 1}/${MISSIONS.length} pronta para continuar`}
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-charcoal/70 dark:text-off-white/70">
                    Rascunho, placar e registros desta trilha ficam guardados neste navegador.
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                {savedCheckpoint && (
                  <Button
                    onClick={() => resumeGame(savedCheckpoint)}
                    className="h-14 rounded-[2px] border-2 border-charcoal bg-burnt-yellow px-8 text-xs font-black uppercase tracking-widest text-charcoal shadow-[4px_4px_0_0_rgba(26,26,26,0.32)] hover:bg-burnt-yellow/90"
                  >
                    Continuar treino <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
                <Button
                  onClick={startGame}
                  className="h-14 rounded-[2px] border-2 border-charcoal bg-charcoal px-8 text-xs font-black uppercase tracking-widest text-off-white shadow-[4px_4px_0_0_rgba(126,126,110,0.6)] hover:bg-charcoal/90 dark:bg-burnt-yellow dark:text-charcoal"
                >
                  {savedCheckpoint ? "Reiniciar simulacao" : "Iniciar simulacao"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="border-4 border-charcoal bg-off-white p-4 shadow-[8px_8px_0_0_rgba(26,26,26,1)] dark:border-cement dark:bg-[#1E1E1B]">
              <div className="border-2 border-charcoal bg-[#111] p-5 text-off-white">
                <div className="mb-5 flex items-center justify-between border-b border-off-white/20 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Minha Jornada</p>
                    <p className="mt-1 text-xl font-black">Missao guiada</p>
                  </div>
                  <ClipboardCheck className="h-9 w-9 text-burnt-yellow" />
                </div>
                <div className="space-y-3">
                  {STEP_ORDER.map((item, index) => (
                    <div key={item} className="flex items-center gap-3 border border-off-white/20 bg-off-white/5 p-3">
                      <span className="flex h-8 w-8 items-center justify-center border border-burnt-yellow text-xs font-black text-burnt-yellow">
                        {index + 1}
                      </span>
                      <span className="text-sm font-black uppercase tracking-widest">{STEP_LABELS[item]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {screen === "mission" && (
          <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="order-1 grid gap-3 lg:hidden">
              <div className="border-2 border-charcoal bg-off-white p-3 shadow-[3px_3px_0_0_rgba(26,26,26,1)] dark:border-cement dark:bg-[#1E1E1B]">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Missao ativa</p>
                    <p className="text-xl font-black uppercase">{missionIndex + 1}/{MISSIONS.length}</p>
                  </div>
                  <p className="max-w-[180px] text-right text-xs font-bold leading-tight">{mission.objective}</p>
                </div>
                <Progress
                  value={progressValue}
                  aria-label={`Progresso da missao ${missionIndex + 1}`}
                  className="mt-3 h-2 rounded-[2px] bg-cement/30"
                  indicatorClassName="bg-burnt-yellow"
                />
              </div>
              <div className="grid grid-cols-[0.75fr_0.75fr_1.5fr] gap-2">
                <MobileMetric label="Concreto" value={`${concretoScore}`} />
                <MobileMetric label="Zen" value={`${zenScore}%`} />
                <div className="border-2 border-charcoal bg-[#111] p-3 text-off-white dark:border-cement">
                  <p className="text-[10px] font-black uppercase tracking-widest text-burnt-yellow">Proxima acao</p>
                  <p className="mt-1 text-xs font-black uppercase leading-tight">{STEP_LABELS[step]}</p>
                </div>
              </div>
              <div className="border-2 border-charcoal bg-off-white p-3 dark:border-cement dark:bg-[#1E1E1B]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">{mission.supportLabel}</p>
                <p className="mt-2 text-xs font-semibold leading-relaxed">{mission.supportMessage}</p>
              </div>
            </div>

            <aside className="order-3 space-y-4 lg:order-1">
              <div className="border-2 border-charcoal bg-off-white p-4 shadow-[4px_4px_0_0_rgba(26,26,26,1)] dark:border-cement dark:bg-[#1E1E1B]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Painel da jornada</p>
                <h2 className="mt-2 text-2xl font-black uppercase">Missao {missionIndex + 1}/{MISSIONS.length}</h2>
                <Progress
                  value={progressValue}
                  aria-label={`Progresso da missao ${missionIndex + 1}`}
                  className="mt-4 h-3 rounded-[2px] bg-cement/30"
                  indicatorClassName="bg-burnt-yellow"
                />
              </div>
              <div className="border-2 border-charcoal bg-off-white p-4 dark:border-cement dark:bg-[#1E1E1B]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">{mission.supportLabel}</p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-charcoal/70 dark:text-off-white/70">
                  {mission.supportMessage}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-charcoal bg-off-white p-3 dark:border-cement dark:bg-[#1E1E1B]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#7E7E70]">Concreto</p>
                  <p className="text-2xl font-black">{concretoScore}</p>
                </div>
                <div className="border-2 border-charcoal bg-off-white p-3 dark:border-cement dark:bg-[#1E1E1B]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#7E7E70]">Zen</p>
                  <p className="text-2xl font-black">{zenScore}%</p>
                </div>
              </div>

              <div
                aria-live="polite"
                aria-atomic="true"
                className="border-2 border-charcoal bg-[#111] p-4 text-off-white dark:border-cement"
              >
                <div className="mb-3 flex items-center gap-2 text-burnt-yellow">
                  <Flame className="h-5 w-5" />
                  <p className="text-xs font-black uppercase tracking-widest">Combo x{combo}</p>
                </div>
                <p className="text-sm font-bold leading-relaxed">{feedback}</p>
              </div>

              <div className="border-2 border-charcoal bg-off-white p-4 dark:border-cement dark:bg-[#1E1E1B]">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#7E7E70]">Registro da acao</p>
                <div className="space-y-2">
                  {log.map((item) => (
                    <p key={item} className="border-l-4 border-burnt-yellow pl-3 text-xs font-semibold leading-relaxed">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </aside>

            <div className="order-2 space-y-5 lg:order-2">
              {guidedMission && (
                <div className="hidden gap-3 sm:grid sm:grid-cols-6">
                {STEP_ORDER.map((item, index) => {
                  const done = completedSteps.includes(item);
                  const active = item === step;
                  return (
                    <div
                      key={item}
                      className={cn(
                        "border-2 p-3 text-center text-[10px] font-black uppercase tracking-widest",
                        done && "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30",
                        active && "border-burnt-yellow bg-burnt-yellow/15 text-charcoal dark:text-off-white",
                        !done && !active && "border-charcoal/20 bg-off-white/60 text-[#7E7E70] dark:border-cement/30 dark:bg-[#1E1E1B]",
                      )}
                    >
                      <span className="mb-1 block text-base">{index + 1}</span>
                      {STEP_LABELS[item]}
                    </div>
                  );
                })}
                </div>
              )}

              <div className="border-4 border-charcoal bg-off-white p-4 shadow-[6px_6px_0_0_rgba(26,26,26,1)] dark:border-cement dark:bg-[#1E1E1B] md:p-6">
                <div className={cn("grid gap-5", guidedMission && "xl:grid-cols-[1fr_330px]")}>
                  <div className="space-y-5">
                    <div className="border-2 border-charcoal bg-[#F8F5EA] p-4 dark:border-cement dark:bg-concrete-dark/40">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Contato em foco</p>
                          <h3 className="mt-1 text-3xl font-black uppercase">{mission.contact}</h3>
                          <p className="text-sm font-black text-[#7E7E70]">{mission.handle}</p>
                        </div>
                        <span className="border-2 border-charcoal bg-off-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-charcoal">
                          {mission.source}
                        </span>
                      </div>
                      <div className="border-l-4 border-charcoal bg-off-white p-4 text-sm font-semibold leading-relaxed text-charcoal dark:bg-[#121210] dark:text-off-white">
                        {mission.signal}
                      </div>
                    </div>

                    <ConsequencePanel consequence={consequence} />
                    {hold.tone !== "free" && <MissionHoldPanel hold={hold} />}

                    <div className="grid gap-3 md:grid-cols-3">
                      <ActionButton
                        active={step === "copy"}
                        done={completedSteps.includes("copy")}
                        disabled={step !== "copy"}
                        icon={Copy}
                        label="Preparar mensagem"
                        onClick={() => completeStep("copy", "Modelo preparado. Agora abra o canal onde a conversa vai acontecer.")}
                      />
                      <ActionButton
                        active={step === "open"}
                        done={completedSteps.includes("open")}
                        disabled={step !== "open"}
                        icon={ChannelIcon}
                        label={mission.openActionLabel}
                        onClick={() => completeStep("open", mission.openFeedback)}
                      />
                      <ActionButton
                        active={step === "send"}
                        done={completedSteps.includes("send")}
                        disabled={step !== "send"}
                        icon={Send}
                        label="Confirmar envio"
                        onClick={() => completeStep("send", "Envio confirmado. Agora registre o que aconteceu na conversa.")}
                      />
                    </div>

                    <ConversationSimulator
                      draftMessage={draftMessage}
                      mission={mission}
                      supportLevel={mission.supportLevel}
                      step={step}
                      completedSteps={completedSteps}
                      currentStepIndex={currentStepIndex}
                      onDraftChange={setDraftMessage}
                      onConfirmPersonalization={confirmPersonalization}
                    />

                    {(currentStepIndex >= 4 || registeredResponse) && (
                      <div className={cn(
                        "border-2 border-charcoal p-4 dark:border-cement",
                        step === "response" && !operationMission && "shadow-[4px_4px_0_0_rgba(242,169,0,0.35)]",
                      )}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase tracking-widest">Registrar resposta</p>
                          {!operationMission && (
                            <span className="border border-charcoal bg-off-white px-2 py-1 text-[10px] font-black uppercase tracking-widest dark:border-cement dark:bg-[#121210]">
                              Opcoes da Minha Jornada
                            </span>
                          )}
                        </div>
                        {registeredResponse ? (
                          <StepResolution
                            label="Resposta registrada"
                            value={registeredResponse}
                            message="A classificacao foi salva. Agora escolha o destino da missao."
                          />
                        ) : (
                          <div className="grid gap-3 border-2 border-charcoal bg-[#111] p-4 text-off-white dark:border-cement md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Decisao da conversa</p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-off-white/75">
                                Abra o registro para classificar o retorno antes de mover a missao.
                              </p>
                            </div>
                            <Button
                              type="button"
                              disabled={step !== "response"}
                              onClick={() => setShowResponseDecision(true)}
                              className="h-12 rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow px-4 text-xs font-black uppercase tracking-widest text-charcoal hover:bg-burnt-yellow/90 disabled:opacity-45"
                            >
                              Registrar avanco
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {(currentStepIndex >= 5 || completedRoute) && (
                      <div className={cn(
                        "border-2 border-charcoal p-4 dark:border-cement",
                        step === "route" && !completedRoute && !operationMission && "shadow-[4px_4px_0_0_rgba(242,169,0,0.35)]",
                      )}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase tracking-widest">Encaminhar</p>
                          {!operationMission && (
                            <span className="border border-charcoal bg-off-white px-2 py-1 text-[10px] font-black uppercase tracking-widest dark:border-cement dark:bg-[#121210]">
                              Destino da Minha Jornada
                            </span>
                          )}
                        </div>
                        {completedRoute ? (
                          <StepResolution
                            label="Destino registrado"
                            value={completedRoute.label}
                            message="O recibo abaixo consolidou a missao para o proximo passo."
                          />
                        ) : (
                          <div className="space-y-3">
                            <MissionMemoryPreview memory={missionMemory} />
                            <div className="grid gap-3 border-2 border-charcoal bg-[#111] p-4 text-off-white dark:border-cement md:grid-cols-[1fr_auto] md:items-center">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Proximo destino</p>
                                <p className="mt-2 text-sm font-semibold leading-relaxed text-off-white/75">
                                  Escolha o encaminhamento que preserva consentimento, contexto e ritmo.
                                </p>
                              </div>
                              <Button
                                type="button"
                                disabled={step !== "route"}
                                onClick={() => setShowRouteDecision(true)}
                                className="h-12 rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow px-4 text-xs font-black uppercase tracking-widest text-charcoal hover:bg-burnt-yellow/90 disabled:opacity-45"
                              >
                                Definir destino
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {completedRoute && (
                      <MissionReceipt
                        mission={mission}
                        route={completedRoute}
                        routeHold={getRouteHold(completedRoute)}
                        registeredResponse={registeredResponse}
                        corrections={missionCorrections}
                        memory={missionMemory}
                        finalMission={missionIndex === MISSIONS.length - 1}
                        onContinue={continueAfterReceipt}
                      />
                    )}
                  </div>

                  {guidedMission && (
                    <div className="hidden border-2 border-charcoal bg-[#111] p-4 text-off-white dark:border-cement xl:block">
                    <div className="mb-4 flex items-center justify-between border-b border-off-white/20 pb-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Fluxo espelhado</p>
                        <p className="text-lg font-black">Minha Jornada</p>
                      </div>
                      <ClipboardCheck className="h-8 w-8 text-burnt-yellow" />
                    </div>
                    <div className="space-y-3">
                      {STEP_ORDER.map((item, index) => {
                        const done = completedSteps.includes(item);
                        const active = item === step;
                        return (
                          <div
                            key={item}
                            className={cn(
                              "flex items-center gap-3 border p-3",
                              done && "border-emerald-500 bg-emerald-500/10",
                              active && "border-burnt-yellow bg-burnt-yellow/10",
                              !done && !active && "border-off-white/15 bg-off-white/5",
                            )}
                          >
                            <span className="flex h-9 w-9 items-center justify-center border border-current">
                              {done ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : index + 1}
                            </span>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest">{STEP_LABELS[item]}</p>
                              <p className="text-[11px] font-semibold text-off-white/55">
                                {active ? "Acao liberada agora" : done ? "Concluido" : "Bloqueado pelo fluxo"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {screen === "victory" && (
          <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center">
            <div className="w-full border-4 border-charcoal bg-off-white p-8 text-center shadow-[8px_8px_0_0_rgba(26,26,26,1)] dark:border-cement dark:bg-[#1E1E1B] md:p-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-charcoal bg-emerald-500 text-white shadow-[4px_4px_0_0_rgba(26,26,26,1)]">
                <Award className="h-10 w-10" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Trilha concluida</p>
              <h2 className="mt-3 text-4xl font-black uppercase tracking-normal md:text-5xl">Operador em fluxo real</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-relaxed text-charcoal/75 dark:text-off-white/75">
                Voce concluiu as missoes usando a mesma ordem de botoes que aparece na operacao:
                mensagem, canal, envio, resposta e encaminhamento.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="border-2 border-charcoal p-4 dark:border-cement">
                  <p className="text-[10px] font-black uppercase tracking-widest">Concreto</p>
                  <p className="text-2xl font-black">{concretoScore}</p>
                </div>
                <div className="border-2 border-charcoal p-4 dark:border-cement">
                  <p className="text-[10px] font-black uppercase tracking-widest">Zen</p>
                  <p className="text-2xl font-black">{zenScore}%</p>
                </div>
                <div className="border-2 border-charcoal p-4 dark:border-cement">
                  <p className="text-[10px] font-black uppercase tracking-widest">Correcoes</p>
                  <p className="text-2xl font-black">{totalCorrections}</p>
                </div>
              </div>
              <div className="mt-4 border-2 border-charcoal bg-charcoal p-4 text-left text-off-white dark:border-cement">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Resumo da trilha</p>
                  <p className="text-xs font-black uppercase tracking-widest">{cleanMissions}/{MISSIONS.length} missoes sem correcao</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {missionResults.map((result) => (
                    <div key={`${result.contact}-${result.route}`} className="grid gap-2 border border-off-white/20 bg-off-white/5 p-3 text-xs font-semibold sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="font-black uppercase tracking-widest">{result.contact}</p>
                        <p className="mt-1 text-off-white/65">{result.response} / {result.route}</p>
                        <p className="mt-2 text-off-white/55">{result.memory}</p>
                      </div>
                      <span className={cn(
                        "border px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                        result.corrections === 0 ? "border-emerald-400 text-emerald-300" : "border-burnt-yellow text-burnt-yellow",
                      )}>
                        {result.corrections === 0 ? "Fluxo limpo" : `${result.corrections} correcao`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 border-2 border-charcoal bg-off-white p-4 text-left dark:border-cement dark:bg-[#121210]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">
                    Revisao recomendada
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest">
                    {reviewKinds.length === 0 ? "Fluxo consistente" : `${reviewKinds.length} foco de revisao`}
                  </p>
                </div>
                {reviewKinds.length === 0 ? (
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-charcoal/75 dark:text-off-white/75">
                    Voce manteve personalizacao, registro e encaminhamento alinhados nas missoes desta trilha.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {reviewKinds.map((kind) => (
                      <div key={kind} className="border-2 border-charcoal bg-burnt-yellow/10 p-3 dark:border-cement">
                        <p className="text-xs font-black uppercase tracking-widest">{REVIEW_CUES[kind].title}</p>
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-charcoal/70 dark:text-off-white/70">
                          {REVIEW_CUES[kind].message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 border-2 border-charcoal bg-off-white p-4 text-left dark:border-cement dark:bg-[#121210]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">
                    Competencias praticadas
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest">
                    {COMPETENCY_ORDER.length - reviewKinds.length}/{COMPETENCY_ORDER.length} dominadas
                  </p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {COMPETENCY_ORDER.map((kind) => {
                    const needsReview = reviewKinds.includes(kind);
                    return (
                      <div
                        key={kind}
                        className={cn(
                          "border-2 p-3",
                          needsReview
                            ? "border-dark-yellow bg-burnt-yellow/10"
                            : "border-moss bg-moss/10",
                        )}
                      >
                        <p className="text-xs font-black uppercase tracking-widest">{COMPETENCY_CUES[kind].label}</p>
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-charcoal/70 dark:text-off-white/70">
                          {needsReview ? REVIEW_CUES[kind].title : COMPETENCY_CUES[kind].mastered}
                        </p>
                        <p className={cn(
                          "mt-2 text-[10px] font-black uppercase tracking-widest",
                          needsReview ? "text-dark-yellow" : "text-moss",
                        )}>
                          {needsReview ? "Repetir" : "Dominada"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                {firstReviewMission && (
                  <Button
                    onClick={() => restartAtMission(firstReviewMission.missionIndex)}
                    className="h-12 rounded-[2px] border-2 border-charcoal bg-burnt-yellow px-5 text-xs font-black uppercase tracking-widest text-charcoal hover:bg-burnt-yellow/90"
                  >
                    Repetir missao com revisao
                  </Button>
                )}
                <Button
                  onClick={startGame}
                  variant="outline"
                  className="h-12 rounded-[2px] border-2 border-charcoal text-xs font-black uppercase tracking-widest dark:border-cement"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Jogar novamente
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href="/minha-fila" />}
                  className="h-12 rounded-[2px] bg-charcoal px-8 text-xs font-black uppercase tracking-widest text-off-white hover:bg-charcoal/90 dark:bg-burnt-yellow dark:text-charcoal"
                >
                  Ir para Minha Jornada <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Dialog open={showResponseDecision} onOpenChange={setShowResponseDecision}>
        <DialogContent className="overflow-hidden rounded-[2px] border-2 border-charcoal bg-off-white p-0 shadow-[4px_4px_0_0_rgba(26,26,26,1)] sm:max-w-[540px]">
          <div className="bg-charcoal p-5 text-off-white">
            <DialogTitle className="text-xl font-black uppercase">Registrar avanco da missao</DialogTitle>
            <DialogDescription className="mt-2 font-bold text-off-white/60">
              O que aconteceu no retorno de {mission.contact}?
            </DialogDescription>
          </div>
          <div className="grid max-h-[70vh] gap-3 overflow-y-auto p-5">
            {mission.responseOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseResponse(option)}
                className="w-full rounded-[2px] border-2 border-charcoal bg-off-white p-4 text-left text-charcoal shadow-[2px_2px_0_0_rgba(26,26,26,1)] transition hover:-translate-x-px hover:-translate-y-px hover:bg-burnt-yellow hover:shadow-[3px_3px_0_0_rgba(26,26,26,1)]"
              >
                <p className="text-sm font-black uppercase tracking-wider">{option.label}</p>
                <p className="mt-1 text-xs font-semibold leading-normal text-charcoal/65">{option.hint}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRouteDecision} onOpenChange={setShowRouteDecision}>
        <DialogContent className="overflow-hidden rounded-[2px] border-2 border-charcoal bg-off-white p-0 shadow-[4px_4px_0_0_rgba(26,26,26,1)] sm:max-w-[560px]">
          <div className="bg-charcoal p-5 text-off-white">
            <DialogTitle className="text-xl font-black uppercase">Definir proximo destino</DialogTitle>
            <DialogDescription className="mt-2 font-bold text-off-white/60">
              Escolha qual encaminhamento continua o ciclo de {mission.contact}.
            </DialogDescription>
          </div>
          <div className="grid max-h-[70vh] gap-3 overflow-y-auto p-5">
            {mission.routeOptions.map((option) => {
              const Icon = routeIcon(option.icon);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => chooseRoute(option)}
                  className="w-full rounded-[2px] border-2 border-charcoal bg-off-white p-4 text-left text-charcoal shadow-[2px_2px_0_0_rgba(26,26,26,1)] transition hover:-translate-x-px hover:-translate-y-px hover:bg-burnt-yellow hover:shadow-[3px_3px_0_0_rgba(26,26,26,1)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 border border-charcoal bg-charcoal/5 p-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider">{option.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-normal text-charcoal/65">{option.hint}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <footer className="border-t-2 border-charcoal/10 p-4 text-center text-[10px] font-bold text-[#7E7E70] dark:border-cement/10 dark:text-cement">
        RADAR DE BASE - VOLTA REDONDA - TREINO DE FLUXO, REGISTRO E CUIDADO
      </footer>
    </div>
  );
}
