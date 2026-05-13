"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { PriorityPerson, PersonResponseKind, PersonReferralType } from "@/lib/types";
import { QueueCard } from "./queue-card";
import { QueueList } from "./queue-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/radar/empty-state";
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
  Compass,
  Sparkles,
  ChevronRight,
  ArrowRight,
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
import { calculateOperatorMission } from "@/lib/data/mission-engine";
import { OperatorWellnessCard } from "@/components/radar/wellness/operator-wellness-card";
import { assessQueueWellness } from "@/lib/data/operator-wellness";
import { mapPersonToJourney } from "@/lib/data/journey-mapper";

interface QueueClientProps {
  initialQueue: PriorityPerson[];
  oldPendencies?: PriorityPerson[];
  operatorName: string;
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

export function QueueClient({ initialQueue, oldPendencies = [], operatorName }: QueueClientProps) {
  const { toast } = useToast();
  const { showCompletion } = useCompletion();
  const [queue, setQueue] = useState(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "waiting" | "confirmed">("idle");

  useEffect(() => {
    trackOperationalEvent("minha_fila_opened");
  }, []);

  const currentPerson = queue[currentIndex];
  const mission = useMemo(
    () =>
      calculateOperatorMission({
        tasksAssumed: queue.length,
        tasksCompleted: copyStatus === "confirmed" ? 1 : 0,
        repliesRecorded: 0,
        referralsMade: 0,
        stalePending: oldPendencies.length,
      }),
    [copyStatus, oldPendencies.length, queue.length],
  );
  const wellness = assessQueueWellness(queue.length);
  const completedCount = Math.min(currentIndex, queue.length);
  const progressPercent = queue.length === 0 ? 0 : Math.round((completedCount / queue.length) * 100);
  const nextFive = queue.slice(currentIndex + 1, currentIndex + 6);

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
      title: "Missão em espera",
      description: `@${currentPerson.username} saiu da vez por agora. A trilha segue.`,
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
        toast({ title: "Etapa confirmada", description: "A missão entrou em acompanhamento." });
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
        setShowResponseDialog(false);
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
        setShowReferralDialog(false);
        handleNext();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  if (queue.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState
          type="no_data"
          title="Nenhuma missão na sua trilha"
          description="Sua jornada do operador está limpa neste momento."
          primaryAction={
            <Button
              className="bg-indigo-600 font-black uppercase text-xs tracking-wider hover:bg-indigo-700"
              render={<Link href="/abordagem?filter=sem_responsavel" />}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Assumir missões abertas
            </Button>
          }
          secondaryAction={
            <Button
              variant="outline"
              className="border-zinc-200 font-black uppercase text-xs tracking-wider"
              render={<Link href="/dashboard" />}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" /> Voltar à base
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20">
      <section className="overflow-hidden rounded-[28px] border border-zinc-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_26%),linear-gradient(145deg,#09090b_0%,#18181b_58%,#27272a_100%)] p-6 text-white shadow-2xl shadow-zinc-200/50">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white hover:bg-white/10">
                Fase atual: {missionPhaseLabel(currentPerson)}
              </Badge>
              <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200 hover:bg-emerald-400/10">
                Operador: {operatorName}
              </Badge>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-400">Jornada do operador</p>
              <h2 className="max-w-2xl text-4xl font-black tracking-tight text-white">
                Sua fila virou uma trilha guiada de missões.
              </h2>
              <p className="max-w-2xl text-base font-medium leading-relaxed text-zinc-300">
                Avance uma missão por vez, registre o que aconteceu e mantenha o ritmo da base sem perder clareza nem cuidado.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Missão do operador</p>
                  <p className="mt-2 text-sm font-black text-white">{mission.objective}</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Progresso do dia</p>
                  <p className="mt-2 text-3xl font-black text-white">{progressPercent}%</p>
                  <p className="mt-1 text-xs font-medium text-zinc-400">
                    {completedCount} de {queue.length} missões atravessadas
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Alerta de bem-estar</p>
                  <p className="mt-2 text-sm font-black text-white">
                    {wellness.level === "healthy"
                      ? "Ritmo estável"
                      : wellness.level === "warning"
                        ? "Ajustar cadência"
                        : "Reduzir pressão"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-400">{wellness.microcopy}</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Próxima missão</p>
                  <p className="mt-2 text-sm font-black text-white">
                    {currentPerson.displayName || `@${currentPerson.username}`}
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-400">{currentPerson.nextAction}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="h-12 bg-indigo-600 px-6 text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
                onClick={() => window.scrollTo({ top: 620, behavior: "smooth" })}
              >
                <Compass className="mr-2 h-4 w-4" />
                Iniciar jornada
              </Button>
              <Button
                variant="outline"
                className="h-12 border-white/15 bg-white/5 px-6 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10"
                render={<Link href="/abordagem" />}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Abrir mural de missões
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Próxima missão</p>
                <h3 className="mt-2 text-xl font-black text-white">
                  {currentPerson.displayName || `@${currentPerson.username}`}
                </h3>
              </div>
              <Sparkles className="h-5 w-5 text-indigo-300" />
            </div>
            <p className="text-sm font-semibold leading-relaxed text-zinc-300">{currentPerson.priorityReason}</p>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Abertura sugerida</p>
              <p className="mt-2 text-sm font-black text-white">{currentPerson.nextAction}</p>
            </div>
            <div className="space-y-3">
              {nextFive.map((person, idx) => (
                <div key={person.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 p-3">
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
        </div>
      </section>

      {wellness.level !== "healthy" && <OperatorWellnessCard wellness={wellness} />}

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Hub da jornada</p>
              <h3 className="text-2xl font-black tracking-tight text-zinc-950">Missão em campo agora</h3>
              <p className="max-w-2xl text-sm font-medium text-zinc-500">
                A tela principal do operador agora aponta o passo atual, a próxima ação e a sequência imediata da trilha.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-xs font-black uppercase tracking-wider text-zinc-500"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                Anterior
              </Button>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(6, ((currentIndex + 1) / queue.length) * 100)}%` }}
                />
              </div>
              <Button
                variant="ghost"
                className="text-xs font-black uppercase tracking-wider text-zinc-500"
                onClick={handleNext}
                disabled={currentIndex === queue.length - 1}
              >
                Próxima
              </Button>
            </div>
          </div>

          <QueueCard
            person={currentPerson}
            onCopyDM={handleCopyDM}
            onRegisterResponse={() => setShowResponseDialog(true)}
            onReferral={() => setShowReferralDialog(true)}
            onSkip={handleSkip}
            onNext={handleNext}
            copyStatus={copyStatus}
            onConfirmSent={handleConfirmSent}
            onCancelCopy={() => setCopyStatus("idle")}
          />
        </div>

        <aside className="space-y-6">
          <QueueList tasks={queue} currentIndex={currentIndex} onSelect={setCurrentIndex} />

          <Card className="rounded-[28px] border-zinc-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-zinc-400" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  Regra de operação
                </h4>
              </div>
              <p className="text-sm font-medium leading-relaxed text-zinc-600">
                Toda conversa é manual, contextual e revisada por quem envia. Nenhuma missão autoriza spam, automação de DM ou pedido direto de voto.
              </p>
            </CardContent>
          </Card>

          {oldPendencies.length > 0 && (
            <Card className="rounded-[28px] border-amber-100 bg-amber-50/70 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Pendências antigas</p>
                    <h4 className="mt-1 text-lg font-black text-amber-950">
                      {oldPendencies.length} missões pedem revisão
                    </h4>
                  </div>
                  <Badge variant="outline" className="border-amber-200 bg-white text-amber-700">
                    3+ dias
                  </Badge>
                </div>

                <div className="space-y-3">
                  {oldPendencies.slice(0, 4).map((person) => (
                    <button
                      key={person.id}
                      className="w-full rounded-2xl border border-amber-100 bg-white p-4 text-left transition-colors hover:border-amber-200"
                      onClick={() => {
                        setQueue((prev) => [person, ...prev.filter((p) => p.id !== person.id)]);
                        setCurrentIndex(0);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <p className="text-sm font-black text-zinc-900">
                        {person.displayName || `@${person.username}`}
                      </p>
                      <p className="mt-1 text-xs font-medium text-zinc-500">
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

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[540px]">
          <div className="bg-zinc-950 p-6 text-white">
            <DialogTitle className="text-xl font-black">Registrar avanço da missão</DialogTitle>
            <DialogDescription className="font-medium text-zinc-400">
              O que aconteceu na conversa com @{currentPerson.username}?
            </DialogDescription>
          </div>
          <div className="grid gap-2 p-6">
            {RESPONSE_OPTIONS.map((option) => (
              <button
                key={option.id}
                disabled={isPending}
                className={cn(
                  "w-full rounded-2xl border border-zinc-100 p-4 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/50",
                  isPending && "cursor-not-allowed opacity-50",
                )}
                onClick={() => handleResponse(option.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-zinc-100 p-2 text-zinc-500">
                    <option.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900">{option.label}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">{option.hint}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[560px]">
          <div className="bg-zinc-950 p-6 text-white">
            <DialogTitle className="text-xl font-black">Definir próximo destino</DialogTitle>
            <DialogDescription className="font-medium text-zinc-400">
              Escolha qual missão ou encaminhamento continua o ciclo de @{currentPerson.username}.
            </DialogDescription>
          </div>
          <div className="grid gap-2 p-6">
            {REFERRAL_OPTIONS.map((option) => (
              <button
                key={option.id}
                disabled={isPending}
                className={cn(
                  "w-full rounded-2xl border border-zinc-100 p-4 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/50",
                  isPending && "cursor-not-allowed opacity-50",
                )}
                onClick={() => handleReferral(option.id)}
              >
                <p className="text-sm font-black text-zinc-900">{option.label}</p>
                <p className="mt-1 text-xs font-medium text-zinc-500">{option.hint}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
