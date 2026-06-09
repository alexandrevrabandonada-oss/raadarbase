"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { PriorityPerson, PersonResponseKind, PersonReferralType } from "@/lib/types";
import { QueueCard } from "./queue-card";
import { QueueList } from "./queue-list";
import { EthicalGuardrailBanner } from "@/components/radar/ethical-guardrail-banner";
import { Button } from "@/components/ui/button";
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
  Play,
  Route,
  TowerControl,
  Instagram,
  Copy,
  MessageSquare,
  Trophy,
  Heart,
  Clock,
} from "lucide-react";
import {
  trackOperationalEvent,
  acquireLockAction,
  releaseLockAction,
  checkLockAction,
} from "@/app/actions";
import { syncMetaRecentCommentsAction } from "@/app/integracoes/meta/actions";
import { useToast } from "@/hooks/use-toast";
import { executeOrQueueAction } from "@/lib/offline-queue";
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
import {
  assessQueueWellness,
  checkAndReconcileStreak,
  updateStreakOnActivity,
  getZenOffDays,
  setZenOffDays
} from "@/lib/data/operator-wellness";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";
import { playSynthConfirm, playSynthSuccess, playSynthSkip, playSynthZen } from "@/lib/audio";
import { useCompactMode } from "@/hooks/use-compact-mode";
import { CompactModeToggle } from "@/components/radar/compact-mode-toggle";
import type { RadarMission } from "@/lib/missions/mission-types";
import { buildRecommendedMissionBlock, type MinhaJornadaWorkMode, type QueueMissionPlan } from "@/lib/missions/queue-mission-adapter";

interface QueueClientProps {
  initialQueue: PriorityPerson[];
  oldPendencies?: PriorityPerson[];
  operatorName: string;
  missionPlan?: QueueMissionPlan | null;
  dailyStats: {
    mySentCount: number;
    othersSentCount: number;
    goal: number;
  };
}

const RESPONSE_OPTIONS: Array<{
  id: PersonResponseKind;
  label: string;
  hint: string;
  icon: typeof CheckCircle2;
}> = [
  { id: "nao_respondeu", label: "Sem retorno", hint: "A conversa segue em espera.", icon: XCircle },
  { id: "respondeu_bem", label: "Respondeu bem", hint: "O aviso avançou com boa abertura.", icon: CheckCircle2 },
  { id: "pediu_informacoes", label: "Pediu informações", hint: "Registrar dúvida e seguir na conversa.", icon: HelpCircle },
  { id: "quer_ir_evento", label: "Quer evento", hint: "Há chance de campo concreto.", icon: Calendar },
  { id: "quer_ajudar_presencial", label: "Quer ajudar", hint: "Encaminhar para voluntariado ou campo.", icon: HeartHandshake },
  { id: "quer_conhecer_missao_eluta", label: "Quer aviso digital", hint: "Boa candidata para ação coordenada.", icon: Smartphone },
  { id: "nao_quer_contato", label: "Não quer contato", hint: "A restrição ética precisa ser respeitada.", icon: ShieldAlert },
  { id: "revisar_depois", label: "Revisar depois", hint: "Volta para fila com mais contexto.", icon: History },
];

const POST_SEND_OPTIONS: Array<{
  id: PersonResponseKind;
  label: string;
  hint: string;
  icon: typeof CheckCircle2;
}> = [
  { id: "manter_aguardando", label: "Aguardar resposta", hint: "Aguardar retorno saudável no Instagram.", icon: Clock },
  { id: "respondeu_bem", label: "Já respondeu", hint: "A pessoa respondeu de forma positiva.", icon: CheckCircle2 },
  { id: "revisar_depois", label: "Voltar depois", hint: "Revisar o contato em um momento posterior.", icon: History },
];

const REFERRAL_OPTIONS: Array<{
  id: PersonReferralType;
  label: string;
  hint: string;
}> = [
  { id: "evento_campo", label: "Ação de Campo", hint: "Conectar a pessoa a uma ação presencial." },
  { id: "voluntariado", label: "Voluntariado", hint: "Encaminhar para ajuda recorrente." },
  { id: "missao_eluta", label: "Ação ÉLuta", hint: "Encaminhar para ação digital coordenada." },
  { id: "grupo_lista", label: "Grupo ou Lista", hint: "Manter vínculo por canal de acompanhamento." },
  { id: "missao_simples", label: "Aviso simples", hint: "Fechar ciclo com uma ação pontual." },
  { id: "revisar_depois", label: "Revisar depois", hint: "Segurar a decisão e voltar com contexto." },
  { id: "nao_abordar", label: "Não abordar", hint: "Fechar ciclo por consentimento ou segurança." },
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
      return { title: "Aviso pausado sem perda de histórico.", description: "O contexto ficou salvo para uma retomada segura." };
    default:
      return { title: "Resposta registrada. Próximo passo salvo.", description: "A jornada foi atualizada sem perder o contexto." };
  }
}

function getDailyGoalStatus(streak: number) {
  if (streak < 5) {
    return {
      current: streak,
      target: 5,
      label: "Meta Inicial",
      remaining: 5 - streak,
      emoji: "🧱",
      message: `Você enviou ${streak}/5 DMs hoje. Faltam ${5 - streak} para a Meta Inicial!`,
    };
  } else if (streak < 15) {
    return {
      current: streak,
      target: 15,
      label: "Ritmo de Base",
      remaining: 15 - streak,
      emoji: "🔥",
      message: `Você enviou ${streak}/15 DMs hoje. Faltam ${15 - streak} para o Ritmo de Base!`,
    };
  } else if (streak < 30) {
    return {
      current: streak,
      target: 30,
      label: "Meta de Elite",
      remaining: 30 - streak,
      emoji: "🏆",
      message: `Você enviou ${streak}/30 DMs hoje. Faltam ${30 - streak} para a Meta de Elite!`,
    };
  } else {
    return {
      current: streak,
      target: 30,
      label: "Campeão do Dia",
      remaining: 0,
      emoji: "👑",
      message: `Incrível! Você superou todas as metas com ${streak} DMs hoje!`,
    };
  }
}

export function QueueClient({ initialQueue, oldPendencies = [], operatorName, missionPlan = null, dailyStats }: QueueClientProps) {
  const { toast } = useToast();
  const { showCompletion } = useCompletion();
  const [queue, setQueue] = useState(initialQueue);
  const [stats, setStats] = useState(() => ({
    mySent: dailyStats?.mySentCount || 0,
    othersSent: dailyStats?.othersSentCount || 0,
    goal: dailyStats?.goal || 15,
  }));
  const [filterQuentes, setFilterQuentes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredQueue = useMemo(() => {
    let result = queue;
    if (filterQuentes) {
      result = result.filter((p) => p.temperature === "quente");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.displayName && p.displayName.toLowerCase().includes(q)) ||
          p.username.toLowerCase().includes(q)
      );
    }
    return result;
  }, [queue, filterQuentes, searchQuery]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPerson = filteredQueue[currentIndex];
  const hasRestoredRef = useRef(false);

  // Load search, filter and selected index from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !hasRestoredRef.current) {
      try {
        const savedSearch = localStorage.getItem("radar_queue_search");
        const savedQuentes = localStorage.getItem("radar_queue_filter_quentes");
        
        let loadedSearch = "";
        let loadedQuentes = false;

        if (savedSearch) {
          loadedSearch = savedSearch;
          setSearchQuery(savedSearch);
        }
        if (savedQuentes) {
          loadedQuentes = savedQuentes === "true";
          setFilterQuentes(loadedQuentes);
        }

        let tempQueue = initialQueue;
        if (loadedQuentes) {
          tempQueue = tempQueue.filter((p) => p.temperature === "quente");
        }
        if (loadedSearch.trim()) {
          const q = loadedSearch.toLowerCase().trim();
          tempQueue = tempQueue.filter(
            (p) =>
              (p.displayName && p.displayName.toLowerCase().includes(q)) ||
              p.username.toLowerCase().includes(q)
          );
        }

        const savedId = localStorage.getItem("radar_last_person_id");
        if (savedId && tempQueue.length > 0) {
          const idx = tempQueue.findIndex((p) => p.id === savedId);
          if (idx !== -1) {
            setCurrentIndex(idx);
          }
        }
      } catch (e) {
        console.error("Error restoring queue states:", e);
      } finally {
        hasRestoredRef.current = true;
      }
    }
  }, [initialQueue]);

  // Reset index when filters change, but only after initial restore is completed
  useEffect(() => {
    if (hasRestoredRef.current) {
      setCurrentIndex(0);
    }
  }, [searchQuery, filterQuentes]);

  // Save search, filter, and current person ID to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && hasRestoredRef.current) {
      try {
        localStorage.setItem("radar_queue_search", searchQuery);
        localStorage.setItem("radar_queue_filter_quentes", String(filterQuentes));
        if (currentPerson) {
          localStorage.setItem("radar_last_person_id", currentPerson.id);
        }
      } catch (e) {
        console.error("Error saving queue states:", e);
      }
    }
  }, [searchQuery, filterQuentes, currentPerson]);
  const [isPending, startTransition] = useTransition();
  const [sunMode, setSunMode] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showPostSendDialog, setShowPostSendDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "waiting" | "confirmed">("idle");
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const editedMessage = currentPerson
    ? (editedMessages[currentPerson.id] ?? currentPerson.suggestedMessage ?? "")
    : "";
  const updateEditedMessage = (text: string) => {
    if (!currentPerson) return;
    setEditedMessages((current) => ({ ...current, [currentPerson.id]: text }));
  };

  const [focusMode, setFocusMode] = useState(false);
  const [expressMode, setExpressMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("radar_envio_expresso") === "true";
    }
    return false;
  });

  const handleToggleExpressMode = useCallback(() => {
    const nextVal = !expressMode;
    setExpressMode(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("radar_envio_expresso", String(nextVal));
    }
  }, [expressMode]);

  const [streak, setStreak] = useState(() => {
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().split("T")[0];
      const key = `radar_streak_${today}`;
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [multiDayStreak, setMultiDayStreak] = useState(() => {
    if (typeof window !== "undefined") {
      const reconciled = checkAndReconcileStreak();
      return reconciled.currentStreak;
    }
    return 0;
  });

  const completionSoundPlayedRef = useRef(false);

  useEffect(() => {
    if (queue.length === 0 && initialQueue.length > 0 && !completionSoundPlayedRef.current) {
      playSynthSuccess();
      completionSoundPlayedRef.current = true;
    }
  }, [queue.length, initialQueue.length]);

  const incrementStreak = useCallback(() => {
    setStreak((prev) => {
      const next = prev + 1;
      if (typeof window !== "undefined") {
        const today = new Date().toISOString().split("T")[0];
        const key = `radar_streak_${today}`;
        localStorage.setItem(key, next.toString());
      }
      return next;
    });

    setStats((prev) => ({
      ...prev,
      mySent: prev.mySent + 1,
    }));

    if (typeof window !== "undefined") {
      const updated = updateStreakOnActivity();
      setMultiDayStreak(updated.currentStreak);
    }
  }, []);

  const [showZenSettings, setShowZenSettings] = useState(false);
  const [selectedZenDays, setSelectedZenDays] = useState<number[]>([]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("rodada") !== "foco") return;

    const focusTimer = window.setTimeout(() => {
      setFocusMode(true);
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setSelectedZenDays(getZenOffDays());
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const handleSaveZenDays = (days: number[]) => {
    setSelectedZenDays(days);
    setZenOffDays(days);
    playSynthZen();
    toast({
      title: "Ritmo Zen atualizado 🧘",
      description: "Seus dias de descanso programados foram salvos com sucesso.",
    });
  };

  const openResponseDialog = () => {
    playSynthConfirm();
    setShowResponseDialog(true);
  };

  const openReferralDialog = () => {
    playSynthConfirm();
    setShowReferralDialog(true);
  };

  const openZenSettings = () => {
    playSynthConfirm();
    setShowZenSettings(true);
  };

  const [isNotebookViewport, setIsNotebookViewport] = useState(false);
  const [workMode, setWorkMode] = useState<MinhaJornadaWorkMode>("recommended");
  const [lockState, setLockState] = useState<{ locked: boolean; lockedByOther: boolean; ownerName?: string } | null>(null);

  useEffect(() => {
    trackOperationalEvent("minha_fila_opened");
  }, []);

  useEffect(() => {
    const currentPerson = filteredQueue[currentIndex];
    if (!currentPerson) {
      const resetTimer = window.setTimeout(() => setLockState(null), 0);
      return () => window.clearTimeout(resetTimer);
    }

    let active = true;

    async function manageLock() {
      const checkRes = await checkLockAction(currentPerson.id);
      if (!active) return;

      if (checkRes.ok && checkRes.lockedByOther) {
        setLockState({
          locked: true,
          lockedByOther: true,
          ownerName: checkRes.ownerName
        });
      } else {
        const acquireRes = await acquireLockAction(currentPerson.id);
        if (!active) return;

        if (acquireRes.ok && acquireRes.success) {
          setLockState({
            locked: true,
            lockedByOther: false
          });
        } else {
          setLockState({
            locked: true,
            lockedByOther: true,
            ownerName: acquireRes.ownerName || "outro operador"
          });
        }
      }
    }

    manageLock();

    const interval = setInterval(() => {
      if (active) {
        acquireLockAction(currentPerson.id);
      }
    }, 2 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
      releaseLockAction(currentPerson.id);
    };
  }, [currentIndex, filteredQueue]);

  useEffect(() => {
    const updateViewport = () => {
      setIsNotebookViewport(window.innerWidth < 1366);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const wellness = assessQueueWellness(filteredQueue.length);
  const isZenDay = typeof window !== "undefined" && selectedZenDays.includes(new Date().getDay());
  const completedCount = Math.min(currentIndex, filteredQueue.length);
  const progressPercent = filteredQueue.length === 0 ? 0 : Math.round((completedCount / filteredQueue.length) * 100);
  const {
    hydrated: compactHydrated,
    manualCompact,
    isCompact,
    setCompact,
  } = useCompactMode({
    storageKey: "radar_minha_jornada_compacto",
    autoCompact: isNotebookViewport || filteredQueue.length > 5,
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

  useEffect(() => {
    if (initialQueue.length === 0 || queue.length > initialQueue.length / 2) {
      return;
    }

    const lastSync = localStorage.getItem("radar_last_auto_sync_comments");
    const now = Date.now();
    if (lastSync && now - Number(lastSync) <= 10 * 60 * 1000) {
      return;
    }

    localStorage.setItem("radar_last_auto_sync_comments", String(now));
    toast({
      title: "Atualizando fila 🔄",
      description: "A maioria das DMs foi enviada. Sincronizando novas interações de base...",
    });
    startTransition(async () => {
      try {
        const result = await syncMetaRecentCommentsAction();
        if (result.ok) {
          toast({
            title: "Fila atualizada! 🎉",
            description: "Novas interações do Instagram sincronizadas.",
          });
          window.location.reload();
        }
      } catch (err) {
        console.error("Auto sync in queue client failed:", err);
      }
    });
  }, [initialQueue.length, queue.length, startTransition, toast]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCopyStatus("idle");
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCopyStatus("idle");
    } else {
      toast({ title: "Fim da trilha", description: "Você chegou ao fim da fila atual." });
    }
  }, [currentIndex, filteredQueue.length, toast]);

  const handleSkip = useCallback(() => {
    if (!currentPerson) return;
    playSynthSkip();
    toast({
      title: "Aviso pausado sem perda de histórico.",
      description: `@${currentPerson.username} saiu da vez por agora. A trilha segue com o contexto preservado.`,
    });
    handleNext();
  }, [currentPerson, handleNext, toast]);

  const handleCopyDM = useCallback(async () => {
    if (!currentPerson) return;
    const messageToCopy = editedMessage || currentPerson.suggestedMessage || "";
    if (messageToCopy) {
      await navigator.clipboard.writeText(messageToCopy);
      playSynthConfirm();
      
      const igUsername = currentPerson.username.replace(/^@+/, "");
      const igUrl = `https://www.instagram.com/${igUsername}/`;
      window.open(igUrl, "_blank");

      if (expressMode) {
        toast({ title: "Envio Expresso Ativo", description: "Mensagem copiada, direct aberto e contato avançado!" });
        await executeOrQueueAction("recordDMPrepared", [currentPerson.id, "minha_fila", currentPerson.suggestedTemplateId], toast);
        
        startTransition(async () => {
          const confirmResult = await executeOrQueueAction("confirmDMSent", [currentPerson.id, "minha_fila", currentPerson.suggestedTemplateId], toast);
          if (confirmResult.ok) {
            const responseResult = await executeOrQueueAction("recordResponse", [currentPerson.id, "manter_aguardando"], toast);
            if (responseResult.ok) {
              playSynthSuccess();
              incrementStreak();
              
              const newQueue = queue.filter((p) => p.id !== currentPerson.id);
              setQueue(newQueue);
              const nextFilteredLength = filterQuentes 
                ? newQueue.filter((p) => p.temperature === "quente").length 
                : newQueue.length;
              if (currentIndex >= nextFilteredLength && nextFilteredLength > 0) {
                setCurrentIndex(Math.max(0, nextFilteredLength - 1));
              }
              setCopyStatus("idle");
            }
          }
        });
      } else {
        toast({ title: "Mensagem copiada e direct aberto", description: "Envie a mensagem no Instagram e confirme." });
        await executeOrQueueAction("recordDMPrepared", [currentPerson.id, "minha_fila", currentPerson.suggestedTemplateId], toast);
        setCopyStatus("waiting");
      }
    }
  }, [
    currentPerson,
    editedMessage,
    expressMode,
    toast,
    startTransition,
    incrementStreak,
    queue,
    filterQuentes,
    currentIndex,
  ]);

  const handleConfirmSent = useCallback(async () => {
    if (!currentPerson) return;
    startTransition(async () => {
      const result = await executeOrQueueAction("confirmDMSent", [currentPerson.id, "minha_fila", currentPerson.suggestedTemplateId], toast);
      if (result.ok) {
        const responseResult = await executeOrQueueAction("recordResponse", [currentPerson.id, "manter_aguardando"], toast);
        if (responseResult.ok) {
          playSynthSuccess();
          incrementStreak();
          if (!result.offline) {
            toast({ title: "Envio manual confirmado", description: "Contato marcado como aguardando retorno." });
          }
          const newQueue = queue.filter((p) => p.id !== currentPerson.id);
          setQueue(newQueue);
          const nextFilteredLength = filterQuentes 
            ? newQueue.filter((p) => p.temperature === "quente").length 
            : newQueue.length;
          if (currentIndex >= nextFilteredLength && nextFilteredLength > 0) {
            setCurrentIndex(Math.max(0, nextFilteredLength - 1));
          }
          setCopyStatus("idle");
        } else {
          toast({ title: "Erro", description: responseResult.error, variant: "destructive" });
        }
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  }, [currentPerson, toast, startTransition, incrementStreak, queue, filterQuentes, currentIndex]);

  const handlePostSendResponse = async (kind: PersonResponseKind) => {
    startTransition(async () => {
      const result = await executeOrQueueAction("recordResponse", [currentPerson.id, kind], toast);
      if (result.ok) {
        playSynthSuccess();
        showCompletion("response_recorded");
        if (!result.offline) {
          toast({ title: "Avanço registrado", description: "O estado do contato foi atualizado." });
        }
        setShowPostSendDialog(false);
        setCopyStatus("idle");
        incrementStreak();
        const newQueue = queue.filter((p) => p.id !== currentPerson.id);
        setQueue(newQueue);
        const nextFilteredLength = filterQuentes 
          ? newQueue.filter((p) => p.temperature === "quente").length 
          : newQueue.length;
        if (currentIndex >= nextFilteredLength && nextFilteredLength > 0) {
          setCurrentIndex(Math.max(0, nextFilteredLength - 1));
        }
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleResponse = async (kind: PersonResponseKind) => {
    startTransition(async () => {
      const result = await executeOrQueueAction("recordResponse", [currentPerson.id, kind], toast);
      if (result.ok) {
        playSynthSuccess();
        showCompletion(kind === "nao_quer_contato" ? "dnc_respected" : "response_recorded");
        if (!result.offline) {
          const feedback = missionFeedback(kind);
          toast({ title: feedback.title, description: feedback.description });
        }
        setShowResponseDialog(false);
        incrementStreak();
        const newQueue = queue.filter((p) => p.id !== currentPerson.id);
        setQueue(newQueue);
        const nextFilteredLength = filterQuentes 
          ? newQueue.filter((p) => p.temperature === "quente").length 
          : newQueue.length;
        if (currentIndex >= nextFilteredLength && nextFilteredLength > 0) {
          setCurrentIndex(Math.max(0, nextFilteredLength - 1));
        }
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleReferral = async (type: PersonReferralType) => {
    startTransition(async () => {
      const result = await executeOrQueueAction("recordReferral", [currentPerson.id, type], toast);
      if (result.ok) {
        playSynthSuccess();
        showCompletion("referral_done");
        if (!result.offline) {
          toast({ title: "Encaminhamento registrado.", description: "O aviso ganhou um destino claro com histórico preservado." });
        }
        setShowReferralDialog(false);
        incrementStreak();
        handleNext();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditing = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.getAttribute("contenteditable") === "true"
      );

      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (copyStatus === "waiting") {
          handleConfirmSent();
        } else if (copyStatus === "confirmed") {
          handleNext();
        } else if (copyStatus === "idle") {
          handleCopyDM();
        }
        return;
      }

      if (isEditing) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "enter":
          e.preventDefault();
          if (copyStatus === "waiting") {
            handleConfirmSent();
          } else if (copyStatus === "confirmed") {
            handleNext();
          } else if (copyStatus === "idle") {
            handleCopyDM();
          }
          break;
        case "s":
        case "e":
          if (copyStatus === "waiting") {
            e.preventDefault();
            handleConfirmSent();
          }
          break;
        case "escape":
        case "p":
          e.preventDefault();
          handleSkip();
          break;
        case "r":
          e.preventDefault();
          if (copyStatus === "waiting") {
            setShowPostSendDialog(true);
          } else {
            setShowResponseDialog(true);
          }
          break;
        case "g":
        case "h":
          e.preventDefault();
          setShowReferralDialog(true);
          break;
        case "arrowleft":
        case "v":
          e.preventDefault();
          handlePrev();
          break;
        case "arrowright":
        case "n":
          e.preventDefault();
          handleNext();
          break;
        case "c":
          e.preventDefault();
          setCompact(!isCompact);
          break;
        case "u":
        case "o":
          e.preventDefault();
          setSunMode(!sunMode);
          break;
        case "x":
          e.preventDefault();
          handleToggleExpressMode();
          break;
        case "?":
          e.preventDefault();
          setShowShortcutsDialog(true);
          break;
        case "/":
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    copyStatus,
    currentIndex,
    filteredQueue,
    isCompact,
    sunMode,
    expressMode,
    setCompact,
    handleConfirmSent,
    handleNext,
    handleCopyDM,
    handleSkip,
    handlePrev,
    handleToggleExpressMode,
    setShowPostSendDialog,
    setShowResponseDialog,
    setShowReferralDialog,
    setSunMode,
    setShowShortcutsDialog
  ]);

  if (filteredQueue.length === 0) {
    if (queue.length > 0) {
      if (searchQuery.trim()) {
        return (
          <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="relative overflow-hidden rounded-[2px] border-2 border-black bg-charcoal p-6 text-white shadow-[6px_6px_0px_0px_rgba(242,169,0,0.3)] md:p-8">
              <div className="relative flex flex-col items-center justify-center text-center space-y-6 py-12">
                <div className="inline-flex items-center gap-2 rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                  🔍 Busca Ativa
                </div>
                <div className="space-y-3 max-w-lg">
                  <h2 className="text-3xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                    Nenhum resultado
                  </h2>
                  <p className="text-sm font-semibold leading-6 text-zinc-300">
                    Nenhum contato na fila corresponde ao termo &ldquo;<strong className="text-white">{searchQuery}</strong>&rdquo;.
                  </p>
                </div>

                <Button
                  className="h-12 rounded-[2px] border-2 border-black bg-burnt-yellow px-6 text-xs font-black uppercase tracking-wider text-charcoal hover:bg-burnt-yellow/90 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]"
                  onClick={() => {
                    playSynthConfirm();
                    setSearchQuery("");
                  }}
                >
                  Limpar Busca
                </Button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="relative overflow-hidden rounded-[2px] border-2 border-black bg-charcoal p-6 text-white shadow-[6px_6px_0px_0px_rgba(242,169,0,0.3)] md:p-8">
            <div className="absolute top-6 left-6 text-burnt-yellow/45 animate-pulse">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="absolute bottom-6 right-6 text-burnt-yellow/45 animate-pulse">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="relative flex flex-col items-center justify-center text-center space-y-6 py-12">
              <div className="inline-flex items-center gap-2 rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
                <Flame className="h-3.5 w-3.5 fill-burnt-yellow" />
                Filtro Ativo
              </div>
              <div className="space-y-3 max-w-lg">
                <h2 className="text-3xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
                  Sem pessoas quentes
                </h2>
                <p className="text-sm font-semibold leading-6 text-zinc-300">
                  Não há mais nenhuma pessoa classificada como <strong className="text-white">quente 🔥</strong> (mais engajada) na sua fila de hoje. No entanto, ainda restam <strong className="text-white">{queue.length} pessoas</strong> na fila geral.
                </p>
              </div>

              <Button
                className="h-12 rounded-[2px] border-2 border-black bg-burnt-yellow px-6 text-xs font-black uppercase tracking-wider text-charcoal hover:bg-burnt-yellow/90 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]"
                onClick={() => {
                  playSynthConfirm();
                  setFilterQuentes(false);
                  setCurrentIndex(0);
                }}
              >
                Ver fila completa ({queue.length} pessoas)
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="relative overflow-hidden rounded-[2px] border-2 border-black bg-charcoal p-6 text-white shadow-[6px_6px_0px_0px_rgba(242,169,0,0.3)] md:p-8">
          <div className="absolute top-6 left-6 text-burnt-yellow/45 animate-pulse">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="absolute bottom-6 right-6 text-burnt-yellow/45 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>

          <div className="relative flex flex-col items-center justify-center text-center space-y-8 py-12">
            <div className="inline-flex items-center gap-2 rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">
              <Flame className="h-3.5 w-3.5 fill-burnt-yellow" />
              Fila Limpa • Vitória
            </div>

            <div className="space-y-3 max-w-2xl">
              <h2 className="text-4xl font-black uppercase leading-none tracking-tight text-white md:text-6xl">
                {initialQueue.length > 0 ? "Missão Cumprida!" : "Fila Limpa!"}
              </h2>
              <p className="text-sm font-semibold leading-6 text-zinc-300 max-w-lg mx-auto">
                {initialQueue.length > 0 ? (
                  <>Excelente trabalho, <span className="text-white font-bold">{operatorName}</span>! Você processou todos os contatos da sua fila de hoje. A base de dados agora está em paz e atualizada.</>
                ) : (
                  <>Olá, <span className="text-white font-bold">{operatorName}</span>! Sua fila de prioridades está totalmente limpa hoje. A base de dados está em paz e atualizada.</>
                )}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-3 w-full max-w-2xl mt-4">
              <div className="rounded-[2px] border-2 border-cement bg-charcoal/60 p-5 text-center shadow-[3px_3px_0px_0px_rgba(242,169,0,0.15)] flex flex-col items-center justify-center">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400">Você Enviou</span>
                <span className="text-3xl font-black text-white mt-2">{stats.mySent}</span>
                <span className="text-[10px] text-zinc-500 font-semibold mt-1">DMs confirmadas hoje</span>
              </div>
              <div className="rounded-[2px] border-2 border-cement bg-charcoal/60 p-5 text-center shadow-[3px_3px_0px_0px_rgba(242,169,0,0.15)] flex flex-col items-center justify-center">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-zinc-400">Outros Enviaram</span>
                <span className="text-3xl font-black text-white mt-2">{stats.othersSent}</span>
                <span className="text-[10px] text-zinc-500 font-semibold mt-1">DMs da equipe hoje</span>
              </div>
              <div className="rounded-[2px] border-2 border-burnt-yellow bg-burnt-yellow/15 p-5 text-center shadow-[3px_3px_0px_0px_rgba(242,169,0,0.3)] flex flex-col items-center justify-center">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-burnt-yellow flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 fill-burnt-yellow" /> Falta para a Meta
                </span>
                <span className="text-3xl font-black text-burnt-yellow mt-2">
                  {Math.max(0, stats.goal - stats.mySent)}
                </span>
                <span className="text-[10px] text-burnt-yellow/80 font-semibold mt-1">Meta: {stats.goal} DMs</span>
              </div>
            </div>

            {/* Operator Wellness & Zen Check */}
            <div className="border-2 border-cement bg-charcoal/40 p-4 max-w-md rounded-[2px] text-xs font-semibold leading-normal text-zinc-400">
              <p className="text-white uppercase font-black tracking-widest text-[10px] mb-1 flex items-center justify-center gap-1.5">
                🧘 Ritmo Concreto Zen
              </p>
              A consistência protege contra o burnout. Seus dias de descanso programados estão mantendo sua saúde mental e seu combo de dias protegidos. Respire, hidrate-se e descanse!
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                className="h-12 rounded-[2px] border-2 border-black bg-burnt-yellow px-6 text-xs font-black uppercase tracking-wider text-charcoal hover:bg-burnt-yellow/90 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]"
                onClick={() => window.location.reload()}
              >
                🔄 Atualizar Fila
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-[2px] border-2 border-cement bg-charcoal text-xs font-black uppercase tracking-wider text-off-white hover:bg-cement/15 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]"
                onClick={() => {
                  playSynthSuccess();
                }}
              >
                🔊 Tocar Comemoração
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentMission = missionBySubjectId.get(currentPerson.id) ?? null;
  const nextFive = filteredQueue.slice(currentIndex + 1, currentIndex + 6);
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
  const currentBlocked = holdTone === "blocked" || Boolean(currentMission?.guardrail.blocksContact) || Boolean(lockState?.lockedByOther);
  const currentWaiting = holdTone === "waiting";
  const currentHoldLabel = currentMission?.guardrail.message
    || (currentBlocked
      ? lockState?.lockedByOther
        ? `Bloqueado temporariamente: sendo atendido por ${lockState.ownerName}.`
        : currentPerson.doNotContactReason || "Restrição ética ativa."
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
    <div className={cn("transition-colors duration-300 w-full min-h-screen", sunMode ? "sun-mode bg-[#FFF7CD] pb-24" : "")}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-b border-cement/15 pb-4 w-full">
          <div className="flex items-center gap-2 w-full sm:w-80">
            <span className="text-[10px] font-black uppercase tracking-widest text-cement shrink-0">
              Buscar:
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Nome ou @usuario... (Atalho: /)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.currentTarget.blur();
                }
              }}
              className="w-full h-8 px-3 border-2 border-black rounded-[2px] bg-white text-xs font-semibold text-charcoal focus:ring-0 focus:outline-none placeholder:text-cement/70 shadow-[1.5px_1.5px_0px_0px_rgba(11,11,11,1)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cement">
                Filtro:
              </span>
              <button
                onClick={() => {
                  playSynthConfirm();
                  setFilterQuentes(!filterQuentes);
                  setCurrentIndex(0);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 border-2 text-[10px] font-black uppercase tracking-wider rounded-[2px] transition-all",
                  filterQuentes
                    ? "border-black bg-burnt-yellow text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                    : "border-cement/30 bg-transparent text-cement hover:border-black hover:text-charcoal"
                )}
              >
                🔥 Quentes
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cement">
                Envio:
              </span>
              <button
                onClick={() => {
                  playSynthConfirm();
                  handleToggleExpressMode();
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 border-2 text-[10px] font-black uppercase tracking-wider rounded-[2px] transition-all",
                  expressMode
                    ? "border-black bg-burnt-yellow text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                    : "border-cement/30 bg-transparent text-cement hover:border-black hover:text-charcoal"
                )}
              >
                🚀 Expresso {expressMode ? "Ativo" : "Inativo"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cement">
                Visualização:
              </span>
              <button
                onClick={() => {
                  playSynthConfirm();
                  setSunMode(!sunMode);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 border-2 text-[10px] font-black uppercase tracking-wider rounded-[2px] transition-all",
                  sunMode
                    ? "border-black bg-white text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] animate-pulse"
                    : "border-cement/30 bg-transparent text-cement hover:border-black hover:text-charcoal"
                )}
              >
                {sunMode ? "☀️ Sol" : "🔆 Sol"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cement">
                Ajuda:
              </span>
              <button
                onClick={() => {
                  playSynthConfirm();
                  setShowShortcutsDialog(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1 border-2 border-cement/30 bg-transparent text-cement hover:border-black hover:text-charcoal text-[10px] font-black uppercase tracking-wider rounded-[2px] transition-all"
              >
                ⌨️ Atalhos (?)
              </button>
            </div>
          </div>
        </div>
      {focusMode ? (
        /* ==================== IMMERSIVE MODE: HUD PILOTO AUTOMÁTICO ==================== */
        <div className="fixed inset-0 z-50 bg-[#0B0B0B] text-off-white p-4 md:p-8 flex flex-col justify-center overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-3xl w-full space-y-6">
            <div className="flex items-center justify-between border-b-2 border-cement/20 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow animate-pulse flex items-center gap-2">
                  <Flame className="h-4 w-4 fill-burnt-yellow animate-bounce" /> Rodada individual • Modo foco
                  {filterQuentes && <span className="ml-2 px-1.5 py-0.5 border border-burnt-yellow/45 bg-burnt-yellow/10 rounded-[2px] text-[9px] text-burnt-yellow">Foco Quentes 🔥</span>}
                </span>
                <h1 className="text-lg font-black uppercase tracking-wider text-white">
                  Pessoa {currentIndex + 1} de {filteredQueue.length}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playSynthConfirm();
                    handleToggleExpressMode();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 h-8 px-2.5 border-2 text-[9px] font-black uppercase tracking-wider rounded-[2px] transition-all",
                    expressMode
                      ? "border-black bg-burnt-yellow text-charcoal shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]"
                      : "border-white/20 bg-transparent text-zinc-400 hover:border-white hover:text-white"
                  )}
                >
                  🚀 Expresso {expressMode ? "On" : "Off"}
                </button>
                <button
                  onClick={() => {
                    playSynthConfirm();
                    setFilterQuentes(!filterQuentes);
                    setCurrentIndex(0);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 h-8 px-2.5 border-2 text-[9px] font-black uppercase tracking-wider rounded-[2px] transition-all",
                    filterQuentes
                      ? "border-black bg-burnt-yellow text-charcoal shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]"
                      : "border-white/20 bg-transparent text-zinc-400 hover:border-white hover:text-white"
                  )}
                >
                  🔥 Quentes
                </button>
                <button
                  onClick={() => {
                    playSynthConfirm();
                    setShowShortcutsDialog(true);
                  }}
                  className="flex items-center gap-1.5 h-8 px-2.5 border-2 border-white/20 bg-transparent text-zinc-400 hover:border-white hover:text-white text-[9px] font-black uppercase tracking-wider rounded-[2px] transition-all"
                  title="Atalhos de Teclado (?)"
                >
                  ⌨️ Atalhos
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-2 border-white/20 text-white bg-transparent hover:bg-white/10 rounded-[2px] text-[10px] font-black uppercase"
                  onClick={() => setFocusMode(false)}
                >
                  Sair do foco
                </Button>
              </div>
            </div>

            <div className="w-full h-2.5 border border-black bg-charcoal rounded-none overflow-hidden">
              <div
                className="h-full bg-burnt-yellow transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / filteredQueue.length) * 100}%` }}
              />
            </div>

            {/* Daily Goal Progress Bar (Focus Mode) */}
            {(() => {
              const goal = getDailyGoalStatus(streak);
              const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
              return (
                <div className="border border-white/10 bg-black/45 p-3 rounded-[2px] space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-zinc-400">
                    <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider">
                      {goal.emoji} Meta: <strong className="text-white">{goal.label}</strong>
                    </span>
                    <span className="text-burnt-yellow text-[9px] uppercase font-black tracking-wider">
                      {goal.current} / {goal.target} DMs ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-none border border-black bg-charcoal overflow-hidden">
                    <div 
                      className="h-full bg-burnt-yellow transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-semibold leading-normal">
                    {goal.message}
                  </p>
                </div>
              );
            })()}

            {lockState?.lockedByOther && (
              <div className="border-2 border-rust bg-charcoal p-4 flex items-start gap-3 rounded-[2px] text-xs">
                <ShieldAlert className="h-5 w-5 text-rust shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-black uppercase text-rust tracking-wider">Acesso Concorrente Bloqueado</p>
                  <p className="text-zinc-300 font-semibold mt-1">
                    O operador <strong className="text-white">{lockState.ownerName}</strong> abriu a tela deste contato recentemente. Para evitar mensagens duplicadas, aguarde o tempo de lock ou avance para a próxima pessoa.
                  </p>
                </div>
              </div>
            )}

            {isZenDay && (
              <div className="border border-burnt-yellow/20 bg-burnt-yellow/10 p-3 flex items-start gap-3 rounded-[2px] text-xs">
                <span className="text-sm shrink-0">🧘</span>
                <div>
                  <p className="font-black uppercase text-burnt-yellow tracking-wider">Modo Zen: Dia de Descanso</p>
                  <p className="text-zinc-400 font-semibold mt-0.5">
                    Hoje seu combo de <strong className="text-white">{multiDayStreak} dias</strong> está seguro. Acolha com calma no seu próprio ritmo!
                  </p>
                </div>
              </div>
            )}

            <QueueCard
              person={currentPerson}
              mission={currentMission}
              compact={true}
              contactDisabled={currentBlocked}
              onCopyDM={handleCopyDM}
              onRegisterResponse={openResponseDialog}
              onReferral={openReferralDialog}
              onSkip={handleSkip}
              onNext={handleNext}
              copyStatus={copyStatus}
              onConfirmSent={handleConfirmSent}
              onCancelCopy={() => setCopyStatus("idle")}
              focusMode={focusMode}
              editedMessage={editedMessage}
              setEditedMessage={updateEditedMessage}
            />

            <div className="flex items-center justify-between pt-2 pb-24 md:pb-0">
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
                disabled={currentIndex === filteredQueue.length - 1}
              >
                Avançar
              </Button>
            </div>

            <div className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic pt-4 hidden md:block">
              Preparar, enviar manualmente e registrar antes de avançar.
            </div>

            {/* Sticky Mobile Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 border-t-2 border-black bg-[#1C1C1A] p-3 z-50 flex flex-col gap-2 md:hidden">
              <div className="flex gap-2">
                <Button
                  className="h-12 flex-1 rounded-[2px] bg-burnt-yellow text-charcoal border-2 border-black hover:bg-burnt-yellow/90 font-black uppercase tracking-wider text-xs shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                  onClick={currentBlocked ? handleSkip : copyStatus === "waiting" ? handleConfirmSent : copyStatus === "confirmed" ? handleNext : handleCopyDM}
                  disabled={!currentBlocked && copyStatus === "idle" && !currentPerson.suggestedMessage}
                >
                  {currentBlocked ? (
                    "Pular Bloqueio"
                  ) : copyStatus === "waiting" ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Marcar como Enviado
                    </>
                  ) : copyStatus === "confirmed" ? (
                    <>
                      <ChevronRight className="mr-1 h-3.5 w-3.5" /> Próxima Pessoa
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copiar e Abrir Direct
                    </>
                  )}
                </Button>
                <Button
                  className="h-12 rounded-[2px] bg-charcoal text-off-white border-2 border-zinc-700 hover:bg-zinc-800 font-black uppercase tracking-wider text-xs px-3 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                  onClick={() => window.open(`https://www.instagram.com/${currentPerson.username.replace(/^@+/, "")}/`, "_blank")}
                  disabled={currentBlocked}
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-10 flex-1 rounded-[2px] border-2 border-black bg-white text-charcoal text-xs font-black uppercase shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]"
                  onClick={openResponseDialog}
                  disabled={currentBlocked}
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Resposta
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 flex-1 rounded-[2px] border-2 border-transparent text-xs font-black uppercase text-zinc-400 hover:text-white"
                  onClick={openReferralDialog}
                  disabled={currentBlocked}
                >
                  <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Encaminhar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== STANDARD VIEW ==================== */
        <>
          <GamefulHero
            eyebrow="Jornada do operador"
            title="Minha Jornada"
            description={`Aviso de hoje: ${currentMissionReason}`}
            variant="dark"
            compact={isCompact}
            titleClassName={cn("radar-title-display max-w-[8ch]", isCompact ? "text-[2.8rem] lg:text-[3.2rem] 2xl:text-6xl" : "text-4xl lg:text-5xl 2xl:text-6xl")}
            descriptionClassName={cn(isCompact ? "max-w-[28rem]" : "max-w-[32rem]")}
            metricsClassName={cn("grid-cols-2 gap-2", isCompact ? "lg:grid-cols-5" : "md:grid-cols-3 lg:grid-cols-5")}
            badges={
              <>
                <GamefulHeroBadge>Fase atual: {missionPhaseLabel(currentPerson)}</GamefulHeroBadge>
                <GamefulHeroBadge className="border-[#f0c15b]/25 bg-[#f0c15b]/10 text-[#f7d88c]">Operador: {operatorName}</GamefulHeroBadge>
                {isZenDay && <GamefulHeroBadge className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400">🧘 Dia Zen Ativo</GamefulHeroBadge>}
              </>
            }
            metrics={
              <>
                <GamefulMetricCard label="Fila" value={`${filteredQueue.length}`} tone="dark" detail="Avisos abertos no dia." compact layout="split" />
                <GamefulMetricCard label="Progresso" value={`${progressPercent}%`} tone="dark" detail={`${completedCount} de ${filteredQueue.length} atravessadas`} compact layout="split" />
                <GamefulMetricCard label="Aviso" value={currentMissionType} tone="dark" detail={currentMissionState} compact layout="split" valueClassName="max-w-[12ch]" />
                <GamefulMetricCard label="Combo Diário" value={`x${streak} ⚡`} tone="dark" detail="Ações concluídas hoje." compact layout="split" />
                <GamefulMetricCard label="Combo de Dias" value={multiDayStreak > 0 ? `x${multiDayStreak} 🔥` : "0"} tone="dark" detail={isZenDay ? "Dia Zen: Combo seguro!" : "Mantido com atividade diária."} compact layout="split" />
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
                  Entrar na rodada focada
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
                  onClick={openZenSettings}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Dias de Descanso Zen
                </Button>
                {compactHydrated ? (
                  <CompactModeToggle enabled={manualCompact} autoCompact={isNotebookViewport || filteredQueue.length > 5} onToggle={setCompact} />
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
            statusLabel="Pessoa em foco"
            statusValue={`${currentMissionType} · ${currentMissionState}`}
            statusDetail={currentHoldLabel}
            primaryAction={{
              label: currentBlocked
                ? "Pular Bloqueio"
                : copyStatus === "waiting"
                  ? "Marcar como Enviado"
                  : copyStatus === "confirmed"
                    ? "Próxima Pessoa"
                    : "Copiar e Abrir Direct",
              onClick: currentBlocked
                ? handleSkip
                : copyStatus === "waiting"
                  ? handleConfirmSent
                  : copyStatus === "confirmed"
                    ? handleNext
                    : handleCopyDM,
              icon: currentBlocked
                ? ShieldAlert
                : copyStatus === "waiting"
                  ? CheckCircle2
                  : copyStatus === "confirmed"
                    ? ChevronRight
                    : Copy,
              disabled: !currentBlocked && copyStatus === "idle" && !currentPerson.suggestedMessage,
            }}
            secondaryActions={[
              {
                label: "Abrir Instagram",
                onClick: () => window.open(`https://www.instagram.com/${currentPerson.username.replace(/^@+/, "")}/`, "_blank"),
                icon: Instagram,
                disabled: currentBlocked,
                title: currentBlocked ? "Ação de contato indisponível enquanto o aviso estiver bloqueado." : undefined,
              },
              {
                label: "Registrar Resposta",
                onClick: openResponseDialog,
                icon: MessageSquare,
                disabled: currentBlocked,
                title: currentBlocked ? "Resposta indisponível enquanto o aviso estiver bloqueado." : undefined,
              },
              {
                label: "Próxima Pessoa",
                onClick: handleNext,
                icon: ChevronRight,
                disabled: currentIndex === filteredQueue.length - 1,
              },
            ]}
            shortcutAction={{
              label: "Fila de Prioridades",
              href: "/minha-fila",
              icon: Route,
            }}
          />

          {wellness.level !== "healthy" && !isCompact && <OperatorWellnessCard wellness={wellness} />}

          {isZenDay && (
            <div className="border-2 border-burnt-yellow bg-[#FFFDEB] p-4 flex items-start gap-4 rounded-[2px] text-charcoal">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-burnt-yellow/10 text-burnt-yellow shrink-0 border border-burnt-yellow/20">
                <Heart className="h-5 w-5 fill-burnt-yellow text-burnt-yellow" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-black uppercase text-xs tracking-wider text-charcoal flex items-center gap-1.5">
                    🧘 Dia de Descanso Zen Ativo
                  </h4>
                  <button
                    onClick={openZenSettings}
                    className="text-[10px] font-black uppercase text-burnt-yellow hover:underline"
                  >
                    Ajustar dias de descanso
                  </button>
                </div>
                <p className="text-xs font-semibold leading-relaxed mt-1 text-zinc-700">
                  Hoje é um de seus dias de descanso programados. Seu combo histórico de <strong className="text-charcoal">{multiDayStreak} dias</strong> está totalmente protegido e seguro. Não há qualquer pressão operacional hoje!
                </p>
              </div>
            </div>
          )}

          {/* Daily Goal Progress Card (Standard Mode) */}
          {(() => {
            const goal = getDailyGoalStatus(streak);
            const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
            return (
              <div className="border-2 border-black bg-white p-4 rounded-[2px] shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] space-y-3 text-charcoal mb-8">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    {goal.emoji} Meta do Dia: <strong className="text-charcoal">{goal.label}</strong>
                  </span>
                  <span className="text-burnt-yellow text-xs font-black uppercase tracking-wider bg-charcoal text-white px-2 py-0.5 rounded-[2px] border border-black shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]">
                    {goal.current} / {goal.target} DMs ({percent}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-none border-2 border-black bg-white overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-burnt-yellow border-r-2 border-black transition-all duration-500" 
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-cement font-semibold leading-normal">
                  {goal.message}
                </p>
              </div>
            );
          })()}

          <div className={cn("grid gap-8", isCompact ? "2xl:grid-cols-[1.3fr_0.7fr]" : "xl:grid-cols-[1.3fr_0.7fr]")}>
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Próxima pessoa</p>
                  <h3 className="text-2xl font-black tracking-tight text-charcoal">Continuar Jornada</h3>
                  <p className="max-w-2xl text-xs font-semibold text-cement">
                    A pessoa em foco, o aviso explicável e o próximo passo aparecem primeiro. O restante da trilha entra como apoio.
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
                      style={{ width: `${Math.max(6, ((currentIndex + 1) / filteredQueue.length) * 100)}%` }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    className="text-xs font-black uppercase tracking-wider text-cement hover:text-charcoal"
                    onClick={handleNext}
                    disabled={currentIndex === filteredQueue.length - 1}
                  >
                    Próxima
                  </Button>
                </div>
              </div>

              {lockState?.lockedByOther && (
                <div className="border-2 border-rust bg-white p-4 flex items-start gap-3 rounded-[2px] mb-4 text-xs">
                  <ShieldAlert className="h-5 w-5 text-rust shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-black uppercase text-rust tracking-wider">Acesso Concorrente Bloqueado</p>
                    <p className="text-zinc-700 font-semibold mt-1">
                      O operador <strong className="text-black">{lockState.ownerName}</strong> abriu a tela deste contato recentemente. Para evitar mensagens duplicadas, aguarde o tempo de lock ou avance para a próxima pessoa.
                    </p>
                  </div>
                </div>
              )}

              <QueueCard
                person={currentPerson}
                mission={currentMission}
                compact={isCompact}
                contactDisabled={currentBlocked}
                onCopyDM={handleCopyDM}
                onRegisterResponse={openResponseDialog}
                onReferral={openReferralDialog}
                onSkip={handleSkip}
                onNext={handleNext}
                copyStatus={copyStatus}
                onConfirmSent={handleConfirmSent}
                onCancelCopy={() => setCopyStatus("idle")}
                focusMode={focusMode}
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
                <QueueList
                  tasks={filteredQueue}
                  currentPersonId={currentPerson?.id || ""}
                  onSelect={(personId) => {
                    const idx = filteredQueue.findIndex((p) => p.id === personId);
                    if (idx >= 0) setCurrentIndex(idx);
                  }}
                  compact
                />
              ) : null}
              {recommendedMissions.length > 0 ? (
                <Card className="bloco-concreto relative overflow-hidden py-0">
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cement">Bloco recomendado</p>
                      <h4 className="text-lg font-black text-charcoal">Próximos 5 avisos da engine</h4>
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
                            const targetIndex = mission.subjectId ? filteredQueue.findIndex((person) => person.id === mission.subjectId) : -1;
                            if (targetIndex >= 0) {
                              setCurrentIndex(targetIndex);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            } else {
                              const targetIndexInGeneral = mission.subjectId ? queue.findIndex((person) => person.id === mission.subjectId) : -1;
                              if (targetIndexInGeneral >= 0) {
                                setFilterQuentes(false);
                                setCurrentIndex(targetIndexInGeneral);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                toast({
                                  title: "Filtro desativado",
                                  description: "Exibindo a fila completa para acessar a missão selecionada.",
                                });
                              }
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
                    {filteredQueue.length > 5 ? (
                      <WellbeingLine
                        icon={PauseCircle}
                        title="Bloco sugerido de 5 avisos"
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
                    {/* Botão de redistribuição desativado no modo foco */}
                  </div>
                </CardContent>
              </Card>

              <EthicalGuardrailBanner
                description="Toda conversa é manual, contextual e revisada por quem envia. Nenhuma ação autoriza spam, automação de DM ou pedido direto de voto."
                badgeLabel="Operação humana"
              />

              {oldPendencies.length > 0 && (
                <Card className="bloco-concreto relative overflow-hidden py-0 border-burnt-yellow">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Esperando Retorno</p>
                        <h4 className="mt-1 text-lg font-black text-charcoal">
                          {oldPendencies.length} enviadas e esperando retorno
                        </h4>
                      </div>
                      <Badge variant="outline" className="border-2 border-black bg-white text-charcoal rounded-[2px]">
                        Enviadas
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
                            Aguardando retorno no Instagram. Clique para abrir detalhes ou registrar resposta.
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
                    <h3 className="text-2xl font-black tracking-tight">Leitura do aviso</h3>
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
                  <textarea
                    value={editedMessage}
                    onChange={(e) => updateEditedMessage(e.target.value)}
                    className="w-full min-h-[140px] rounded-[2px] border-2 border-black bg-white p-4 text-sm font-medium leading-relaxed text-charcoal focus:ring-0 focus:outline-none resize-y"
                    disabled={currentBlocked}
                    placeholder="Nenhum modelo ideal encontrado para este contexto. Digite aqui..."
                  />
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
                      {currentBlocked ? "Contato indisponível" : "Copiar e Abrir Direct"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-charcoal">
                  <MapPinned className="h-5 w-5" />
                  <h3 className="text-2xl font-black tracking-tight">Trilha dos próximos avisos</h3>
                </div>
                <p className="text-xs leading-relaxed text-cement font-semibold">
                  As próximas cinco aparecem como caminho imediato da jornada. O foco continua em uma pessoa por vez, sem virar fila infinita.
                </p>
                {!isCompact ? (
                  <QueueList
                    tasks={filteredQueue}
                    currentPersonId={currentPerson?.id || ""}
                    onSelect={(personId) => {
                      const idx = filteredQueue.findIndex((p) => p.id === personId);
                      if (idx >= 0) setCurrentIndex(idx);
                    }}
                  />
                ) : null}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* ==================== SHARED DIALOGS ==================== */}
      <Dialog open={showPostSendDialog} onOpenChange={setShowPostSendDialog}>
        <DialogContent className="overflow-hidden border-2 border-black rounded-[2px] p-0 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bg-white sm:max-w-[540px]">
          <div className="bg-charcoal p-6 text-white rounded-t-[2px]">
            <DialogTitle className="text-xl font-black uppercase">Registrar envio de aviso</DialogTitle>
            <DialogDescription className="font-bold text-zinc-400">
              O aviso de pré-candidatura foi enviado no Instagram para @{currentPerson.username}. Qual é o estado do contato agora?
            </DialogDescription>
          </div>
          <div className="grid gap-3 p-6 max-h-[70vh] overflow-y-auto">
            {POST_SEND_OPTIONS.map((option) => (
              <button
                key={option.id}
                disabled={isPending}
                className={cn(
                  "w-full rounded-[2px] border-2 border-black p-4 text-left transition-all hover:bg-burnt-yellow hover:text-charcoal bg-white text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]",
                  isPending && "cursor-not-allowed opacity-50",
                )}
                onClick={() => handlePostSendResponse(option.id)}
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

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="overflow-hidden border-2 border-black rounded-[2px] p-0 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bg-white sm:max-w-[540px]">
          <div className="bg-charcoal p-6 text-white rounded-t-[2px]">
            <DialogTitle className="text-xl font-black uppercase">Registrar avanço do aviso</DialogTitle>
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
              Escolha qual aviso ou encaminhamento continua o ciclo de @{currentPerson.username}.
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

      <Dialog open={showZenSettings} onOpenChange={setShowZenSettings}>
        <DialogContent className="overflow-hidden border-2 border-black rounded-[2px] p-0 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bg-white sm:max-w-[480px]">
          <div className="bg-charcoal p-6 text-white rounded-t-[2px]">
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              🧘 Ritmo Zen: Dias de Descanso
            </DialogTitle>
            <DialogDescription className="font-bold text-zinc-400">
              Configure em quais dias da semana seu combo de dias estará protegido.
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4 bg-white">
            <p className="text-xs font-semibold leading-relaxed text-zinc-600">
              Nos dias selecionados, a ausência de registro de ações não quebrará seu combo histórico (streak). Escolha os dias que melhor se adequam à sua rotina voluntária:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Domingo", value: 0 },
                { label: "Segunda-feira", value: 1 },
                { label: "Terça-feira", value: 2 },
                { label: "Quarta-feira", value: 3 },
                { label: "Quinta-feira", value: 4 },
                { label: "Sexta-feira", value: 5 },
                { label: "Sábado", value: 6 }
              ].map((day) => {
                const isSelected = selectedZenDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleSaveZenDays(selectedZenDays.filter((d) => d !== day.value));
                      } else {
                        handleSaveZenDays([...selectedZenDays, day.value]);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-[2px] border-2 px-3 py-2 text-xs font-bold transition-all",
                      isSelected
                        ? "border-black bg-burnt-yellow text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
                        : "border-cement/30 bg-transparent text-cement hover:border-black hover:text-charcoal"
                    )}
                  >
                    <span>{day.label}</span>
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                className="h-10 border-2 border-black rounded-[2px] text-xs font-black uppercase"
                onClick={() => setShowZenSettings(false)}
              >
                Concluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent className="overflow-hidden border-2 border-black rounded-[2px] p-0 shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bg-white sm:max-w-[480px]">
          <div className="bg-charcoal p-6 text-white rounded-t-[2px]">
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              ⌨️ Atalhos de Teclado (Fila)
            </DialogTitle>
            <DialogDescription className="font-bold text-zinc-400">
              Controle a fila e realize envios rápidos sem tirar as mãos do teclado.
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4 bg-white text-charcoal">
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-cement">Fluxo de Envio</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Ctrl + Enter / Cmd + Enter</span>
                  <span className="text-cement font-medium">Ação Principal (Copiar/Enviar/Avançar) *Sempre Ativo</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Enter / Espaço</span>
                  <span className="text-cement font-medium">Ação Principal (Copiar/Enviar/Avançar)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">E / S</span>
                  <span className="text-cement font-medium">Confirmar Envio (Marcar como Enviado)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Esc / P</span>
                  <span className="text-cement font-medium">Pular / Deixar em espera</span>
                </div>
              </div>
            </div>

            <hr className="border-black/10 border-dashed" />

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-cement">Navegação e Ações</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">← (ArrowLeft) / V</span>
                  <span className="text-cement font-medium">Voltar para pessoa anterior</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">→ (ArrowRight) / N</span>
                  <span className="text-cement font-medium">Avançar para próxima pessoa</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">R</span>
                  <span className="text-cement font-medium">Registrar resposta</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">G / H</span>
                  <span className="text-cement font-medium">Encaminhar interessado</span>
                </div>
              </div>
            </div>

            <hr className="border-black/10 border-dashed" />

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-cement">Preferências e Modos</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">C</span>
                  <span className="text-cement font-medium">Alternar visualização Compacta</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">U / O</span>
                  <span className="text-cement font-medium">Alternar Modo Sol (Alto Contraste)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">X</span>
                  <span className="text-cement font-medium">Alternar modo Envio Expresso</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">?</span>
                  <span className="text-cement font-medium">Abrir esta ajuda de atalhos</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] font-semibold text-cement italic leading-normal pt-2">
              * Nota: Os atalhos de letra única ficam desativados temporariamente enquanto você digita no campo de texto para evitar disparos acidentais.
            </p>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                className="h-10 border-2 border-black rounded-[2px] text-xs font-black uppercase"
                onClick={() => setShowShortcutsDialog(false)}
              >
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
