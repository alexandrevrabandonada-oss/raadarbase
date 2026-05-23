"use client";

import React from "react";
import Link from "next/link";
import { TRAINING_PHASES, TRAINING_SCENARIOS_DATA } from "@/lib/data/training-phases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  ChevronRight, 
  GraduationCap, 
  ShieldCheck, 
  Lock, 
  Zap, 
  AlertTriangle, 
  ArrowLeft,
  Play,
  BookOpen,
  ClipboardCheck,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrainingScenarioView } from "./training-scenario-view";
import { useCompletion } from "@/hooks/use-completion";
import {
  readMiniGameTrainingResult,
  type MiniGameTrainingResult,
} from "@/lib/training-mini-game-result";
import {
  readTrainingProgress,
  writeTrainingProgress,
} from "@/lib/training-progress";
import { playSynthConfirm, playSynthSuccess, playSynthZen } from "@/lib/audio";

const ETHICAL_COMMITMENT = [
  { id: "e1", label: "Toda DM que eu enviar será manual", icon: Zap },
  { id: "e2", label: "Nunca pedirei votos em nome do Radar", icon: AlertTriangle },
  { id: "e3", label: "Respeitarei o 'Não Abordar' como absoluto", icon: Lock },
  { id: "e4", label: "Não registrarei dados sensíveis nas notas", icon: ShieldCheck },
  { id: "e5", label: "Registrarei a resposta fiel ao que recebi", icon: CheckCircle2 },
];

const OFFICIAL_TRAINING_MATERIALS = [
  {
    id: "operador",
    title: "Treinamento Oficial do Operador",
    description: "Fluxo completo da jornada: Minha Fila, Ficha Rapida, DM, resposta, encaminhamento e guardrails.",
    href: "/docs/radar-de-base-treinamento-operador.md",
  },
  {
    id: "coordenacao",
    title: "Treinamento Oficial da Coordenacao",
    description: "Conducao do ritmo, distribuicao, governanca, fechamento semanal e gestao de feedbacks.",
    href: "/docs/radar-de-base-treinamento-coordenacao.md",
  },
  {
    id: "checklist",
    title: "Checklist de Novo Operador",
    description: "Lista oficial de validacao para liberar operacao real sem depender de explicacao solta.",
    href: "/docs/radar-de-base-checklist-novo-operador.md",
  },
];

const OFFICIAL_COMPLETION_CHECKLIST = [
  { id: "c1", label: "Li o treinamento oficial do operador" },
  { id: "c2", label: "Li o treinamento oficial da coordenacao" },
  { id: "c3", label: "Revisei o checklist de novo operador" },
  { id: "c4", label: "Completei as fases praticas do modo treinamento" },
  { id: "c5", label: "Estou pronto para operar sem depender de orientacao informal" },
];
const PRACTICAL_CHECKLIST_ID = "c4";

export default function TrainingClient() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = React.useState(-1); // -1 is lobby
  const [completedPhases, setCompletedPhases] = React.useState<string[]>([]);
  const [ethicalChecks, setEthicalChecks] = React.useState<string[]>([]);
  const [officialChecklist, setOfficialChecklist] = React.useState<string[]>([]);
  const [isFinished, setIsFinished] = React.useState(false);
  const [miniGameResult, setMiniGameResult] = React.useState<MiniGameTrainingResult | null>(null);
  const [progressReady, setProgressReady] = React.useState(false);
  const { showCompletion } = useCompletion();

  const currentPhase = currentPhaseIndex >= 0 ? TRAINING_PHASES[currentPhaseIndex] : null;
  const phaseProgress = completedPhases.length / TRAINING_PHASES.length;
  const practiceProgress = miniGameResult ? 1 : 0;
  const ethicalProgress = ethicalChecks.length / ETHICAL_COMMITMENT.length;
  const checklistProgress = officialChecklist.length / OFFICIAL_COMPLETION_CHECKLIST.length;
  const progress = Math.round(
    ((phaseProgress + practiceProgress + ethicalProgress + checklistProgress) / 4) * 100,
  );

  React.useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const nextMiniGameResult = readMiniGameTrainingResult();
      const savedProgress = readTrainingProgress();
      setMiniGameResult(nextMiniGameResult);
      if (savedProgress) {
        setCompletedPhases(savedProgress.completedPhases);
        setEthicalChecks(savedProgress.ethicalChecks);
        setOfficialChecklist(savedProgress.officialChecklist);
        setIsFinished(savedProgress.finished);
      }
      if (nextMiniGameResult) {
        setOfficialChecklist((previous) => previous.includes(PRACTICAL_CHECKLIST_ID)
          ? previous
          : [...previous, PRACTICAL_CHECKLIST_ID]);
      }
      setProgressReady(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  React.useEffect(() => {
    if (!progressReady) return;

    writeTrainingProgress({
      completedPhases,
      ethicalChecks,
      finished: isFinished,
      officialChecklist,
      version: 1,
    });
  }, [completedPhases, ethicalChecks, isFinished, officialChecklist, progressReady]);

  const startPhase = (index: number) => {
    setCurrentPhaseIndex(index);
    playSynthConfirm();
  };

  const handleScenarioComplete = () => {
    if (currentPhase && !completedPhases.includes(currentPhase.id)) {
      setCompletedPhases([...completedPhases, currentPhase.id]);
      showCompletion("training_phase_done");
      playSynthSuccess();
    }
    setCurrentPhaseIndex(-1); // Back to lobby
  };

  const toggleEthicalCheck = (id: string) => {
    setEthicalChecks(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    playSynthConfirm();
  };

  const allEthicalDone = ethicalChecks.length === ETHICAL_COMMITMENT.length;
  const allPhasesDone = completedPhases.length === TRAINING_PHASES.length;
  const allOfficialChecklistDone = officialChecklist.length === OFFICIAL_COMPLETION_CHECKLIST.length;
  const trainingRequirements = [
    {
      done: Boolean(miniGameResult),
      label: "Simulador pratico",
      detail: miniGameResult ? "Pratica registrada" : "Jogue o simulador",
    },
    {
      done: allEthicalDone,
      label: "Compromisso etico",
      detail: `${ethicalChecks.length}/${ETHICAL_COMMITMENT.length} confirmacoes`,
    },
    {
      done: allOfficialChecklistDone,
      label: "Checklist oficial",
      detail: `${officialChecklist.length}/${OFFICIAL_COMPLETION_CHECKLIST.length} itens`,
    },
  ];
  const allTrainingRequirementsDone = trainingRequirements.every((requirement) => requirement.done);
  const nextPhaseIndex = TRAINING_PHASES.findIndex((phase) => !completedPhases.includes(phase.id));
  const nextPhase = nextPhaseIndex >= 0 ? TRAINING_PHASES[nextPhaseIndex] : null;

  const toggleOfficialChecklist = (id: string) => {
    if (id === PRACTICAL_CHECKLIST_ID && miniGameResult) return;
    setOfficialChecklist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== item) : [...prev, id],
    );
    playSynthConfirm();
  };

  // 1. Final Screen
  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <Card className="bloco-concreto shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] text-center p-8 space-y-6">
          <div className="h-16 w-16 rounded-[2px] border-2 border-black bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight uppercase text-charcoal">Operador Certificado!</h1>
            <p className="text-sm font-semibold text-cement max-w-md mx-auto leading-relaxed">
              Você completou com sucesso a trilha prática de treinamento e assinou as diretrizes éticas.
            </p>
          </div>
          <div className="pt-4">
             <Button 
               size="lg" 
               className="bg-burnt-yellow text-charcoal border-black rounded-[2px] font-black uppercase text-xs tracking-widest h-12 px-10 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]"
               onClick={() => {
                 playSynthConfirm();
                 window.location.href = "/dashboard";
               }}
             >
               Entrar na Fila Real <ChevronRight className="ml-2 h-4 w-4" />
             </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 2. Scenario View
  if (currentPhase) {
    const scenario = TRAINING_SCENARIOS_DATA.find(s => s.id === currentPhase.scenarioId);
    return (
      <div className="max-w-5xl mx-auto py-8 px-6 space-y-8">
        <header className="flex items-center justify-between border-b border-cement/20 pb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setCurrentPhaseIndex(-1);
                playSynthConfirm();
              }}
              className="rounded-[2px] border-black"
              aria-label="Voltar ao lobby do treinamento"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-cement">Fase {currentPhaseIndex + 1} de {TRAINING_PHASES.length}</p>
              <h2 className="text-xl font-black tracking-tight text-charcoal">{currentPhase.title}</h2>
            </div>
          </div>
        </header>

        {scenario && (
          <TrainingScenarioView 
            scenario={scenario}
            onScenarioComplete={handleScenarioComplete}
          />
        )}
      </div>
    );
  }

  // 3. Lobby View
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10 pb-32">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-charcoal text-off-white border-2 border-black rounded-[2px] shadow-[2px_2px_0px_0px_rgba(242,169,0,0.8)]">
          <GraduationCap className="h-4 w-4 text-burnt-yellow" />
          <span className="text-[9px] font-black uppercase tracking-widest">Trilha de Capacitação</span>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-charcoal">Jornada do Operador</h1>
        <p className="text-sm text-cement max-w-xl mx-auto leading-relaxed">
          Complete os cenários práticos e as diretrizes de ética para habilitar seu acesso real no painel de controle.
        </p>
      </header>

      {/* Retomar treinamento */}
      <Card className="bloco-concreto">
        <CardContent className="grid gap-4 p-5 text-left md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-burnt-yellow">Retomada do treinamento</p>
            {nextPhase ? (
              <>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-charcoal">
                  Fase {nextPhaseIndex + 1}: {nextPhase.title}
                </h2>
                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-cement">
                  Objetivo: {nextPhase.objective}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-charcoal">Fases práticas concluídas</h2>
                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-cement">
                  Revise o compromisso ético e o checklist oficial para liberar sua licença de operador.
                </p>
              </>
            )}
          </div>
          {nextPhase ? (
            <Button
              type="button"
              onClick={() => startPhase(nextPhaseIndex)}
              className="h-10 rounded-[2px] border-black text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]"
            >
              Continuar fase <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                playSynthConfirm();
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              }}
              className="h-10 rounded-[2px] border-black text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]"
            >
              Ver checklist <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Banner do Jogo Prático */}
      <Card className="border-2 border-black bg-burnt-yellow text-charcoal shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] rounded-[2px] overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-charcoal text-off-white text-[9px] font-black uppercase tracking-widest rounded-[2px]">
              <Zap className="h-3 w-3 text-burnt-yellow" /> Jogo Interativo
            </div>
            <h3 className="text-xl font-black tracking-tight uppercase">Estação VR Abandonada: O Jogo</h3>
            <p className="text-xs font-bold max-w-xl leading-relaxed text-charcoal/85">
              Simule a operação de campo, abordagens no Instagram e feche ciclos táticos de forma lúdica. Acumule pontuação Concreto e Zen.
            </p>
            {miniGameResult && (
              <div className="mt-3 border-2 border-charcoal bg-off-white p-3 text-left text-charcoal rounded-[2px]">
                <p className="text-[9px] font-black uppercase tracking-widest">Prática Registrada</p>
                <p className="mt-1 text-xs font-black uppercase">
                  {miniGameResult.masteredKinds.length}/5 Competências Dominadas
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-charcoal/75">
                  {miniGameResult.reviewKinds.length === 0
                    ? "Fluxo prático concluído sem necessidade de revisão."
                    : `${miniGameResult.reviewKinds.length} competência(s) pede(m) nova jogada.`}
                </p>
              </div>
            )}
          </div>
          <Button
            nativeButton={false}
            className="w-full md:w-auto bg-charcoal text-off-white hover:bg-charcoal/90 font-black uppercase text-xs tracking-widest h-11 px-6 rounded-[2px] shrink-0 border-2 border-charcoal shadow-[2px_2px_0_0_rgba(11,11,11,1)]"
            render={<Link href="/treinamento/mini-game" />}
            onClick={() => playSynthConfirm()}
          >
            {miniGameResult ? "Revisar Simulador" : "Jogar Simulador"} <Play className="ml-1.5 h-4 w-4 fill-current text-burnt-yellow" />
          </Button>
        </CardContent>
      </Card>

      {/* Pacote Oficial de Documentos */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-charcoal dark:text-off-white">
          <BookOpen className="h-5 w-5 text-burnt-yellow" />
          <h2 className="text-sm font-black uppercase tracking-wider">Pacote Oficial de Treinamento</h2>
        </div>

        <div className="grid gap-3">
          {OFFICIAL_TRAINING_MATERIALS.map((material) => (
            <Card key={material.id} className="bloco-concreto shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]">
              <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-black text-charcoal dark:text-off-white">{material.title}</p>
                  <p className="text-[10px] font-bold text-cement">{material.description}</p>
                </div>
                <Button
                  nativeButton={false}
                  variant="outline"
                  className="h-8 text-[9px] font-black uppercase tracking-widest border-black rounded-[2px]"
                  render={<Link href={material.href} target="_blank" />}
                  onClick={() => playSynthConfirm()}
                >
                  Abrir Material <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Barra de Progresso Fixo */}
      <Card className="bloco-concreto shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] sticky top-6 z-20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 mb-2.5">
             <span className="text-[10px] font-black uppercase tracking-wider text-cement">Progresso de Capacitação</span>
             <span className="text-lg font-black text-burnt-yellow">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-3.5 bg-zinc-200 border-2 border-black rounded-[2px] overflow-hidden" 
            indicatorClassName="bg-burnt-yellow transition-all duration-1000" 
          />
          <div className="mt-4 grid gap-2 grid-cols-2 lg:grid-cols-4">
            <TrainingProgressMetric label="Fases" value={`${completedPhases.length}/${TRAINING_PHASES.length}`} />
            <TrainingProgressMetric label="Simulador" value={miniGameResult ? "Concluido" : "Pendente"} />
            <TrainingProgressMetric label="Compromisso" value={`${ethicalChecks.length}/${ETHICAL_COMMITMENT.length}`} />
            <TrainingProgressMetric label="Checklist" value={`${officialChecklist.length}/${OFFICIAL_COMPLETION_CHECKLIST.length}`} />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fases Práticas */}
      <div className="grid gap-3">
        {TRAINING_PHASES.map((phase, index) => {
          const isCompleted = completedPhases.includes(phase.id);
          const isLocked = index > completedPhases.length;
          
          return (
            <button
              key={phase.id}
              disabled={isLocked}
              onClick={() => startPhase(index)}
              className={cn(
                "group relative flex items-center gap-5 p-5 rounded-[2px] border-2 transition-all duration-300 text-left w-full shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]",
                isCompleted 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-600 text-emerald-900 dark:text-emerald-300" 
                  : isLocked 
                    ? "bg-zinc-100 dark:bg-zinc-800 border-cement opacity-50 cursor-not-allowed" 
                    : "bg-white dark:bg-concrete-dark border-black hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-[2px] flex items-center justify-center shrink-0 border-2 transition-all duration-500",
                isCompleted ? "bg-emerald-500 border-black text-white" :
                isLocked ? "bg-zinc-200 border-zinc-300 text-zinc-400" :
                "bg-zinc-100 border-black text-charcoal group-hover:bg-burnt-yellow group-hover:-rotate-3"
              )}>
                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <phase.icon className="h-6 w-6" />}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                   <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Fase {index + 1}</p>
                   {isLocked && <Lock className="h-3 w-3 opacity-40 text-charcoal dark:text-off-white" />}
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider">{phase.title}</h3>
                <p className="text-[10px] font-semibold text-cement leading-tight">{phase.description}</p>
              </div>

              {!isCompleted && !isLocked && (
                <div className="h-8 w-8 rounded-full border-2 border-black flex items-center justify-center text-charcoal hover:bg-burnt-yellow hover:-translate-y-[1px] transition-all">
                  <Play className="h-3 w-3 fill-current" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Ethical Commitment Section */}
      {allPhasesDone && (
        <section className="space-y-6 pt-6 border-t-2 border-black border-dashed">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 text-charcoal dark:text-off-white">
              <ShieldCheck className="h-6 w-6 text-burnt-yellow" />
              Compromisso Ético
            </h2>
            <p className="text-xs text-cement">Assinale os guardrails de operação para habilitar sua liberação.</p>
          </div>

          <div className="grid gap-2.5 max-w-xl mx-auto">
            {ETHICAL_COMMITMENT.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleEthicalCheck(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 border-2 rounded-[2px] transition-all text-left shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]",
                  ethicalChecks.includes(item.id) 
                    ? "bg-[#FFF7CD] border-black shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]" 
                    : "bg-white dark:bg-concrete-dark border-cement hover:border-black"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-[2px] flex items-center justify-center shrink-0 border-2 transition-colors",
                  ethicalChecks.includes(item.id) ? "bg-charcoal border-black text-white" : "bg-zinc-50 border-cement text-cement"
                )}>
                  {ethicalChecks.includes(item.id) ? <CheckCircle2 className="h-4 w-4 text-burnt-yellow" /> : <item.icon className="h-4 w-4" />}
                </div>
                <span className={cn(
                  "text-xs font-black uppercase tracking-wider",
                  ethicalChecks.includes(item.id) ? "text-charcoal" : "text-cement"
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mx-auto grid max-w-xl gap-3 grid-cols-3">
            {trainingRequirements.map((requirement) => (
              <div
                key={requirement.label}
                className={cn(
                  "rounded-[2px] border-2 px-3 py-2 text-left shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]",
                  requirement.done
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900"
                    : "border-cement bg-white dark:bg-concrete-dark text-cement",
                )}
              >
                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                  <CheckCircle2 className={cn("h-3.5 w-3.5", requirement.done ? "text-emerald-600 animate-pulse" : "text-cement")} />
                  {requirement.label}
                </p>
                <p className="mt-1 text-[9px] font-bold text-cement">{requirement.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button 
              size="lg" 
              disabled={!allTrainingRequirementsDone}
              className={cn(
                "font-black uppercase text-xs tracking-widest h-14 px-12 rounded-[2px] border-black shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]",
                allTrainingRequirementsDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-zinc-200 text-zinc-400 cursor-not-allowed border-zinc-300"
              )}
              onClick={() => {
                if (!allTrainingRequirementsDone) return;
                setIsFinished(true);
                showCompletion("training_finished");
                playSynthZen();
              }}
            >
              Concluir Treinamento
            </Button>
            {!allTrainingRequirementsDone && (
              <p className="max-w-md text-center text-[10px] font-bold leading-normal text-cement">
                A liberação final exige conclusão do simulador, compromisso ético e checklist oficial completos.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Checklist de Conclusao Oficial */}
      <section className="space-y-4 pt-4 border-t-2 border-black border-dashed">
        <div className="flex items-center gap-2 text-charcoal dark:text-off-white">
          <ClipboardCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-sm font-black uppercase tracking-wider">Checklist de Conclusão Oficial</h2>
        </div>

        <Card className="bloco-concreto">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase tracking-widest text-charcoal">Liberação para Operação Real</CardTitle>
            <CardDescription className="text-[10px] text-cement mt-1">
              Verificações formais de capacitação para novos mobilizadores da equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {OFFICIAL_COMPLETION_CHECKLIST.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleOfficialChecklist(item.id)}
                aria-describedby={item.id === PRACTICAL_CHECKLIST_ID && miniGameResult ? "mini-game-practical-sync" : undefined}
                className={cn(
                  "w-full rounded-[2px] border-2 px-4 py-3 text-left text-xs font-black uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]",
                  officialChecklist.includes(item.id)
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300"
                    : "border-cement bg-white dark:bg-concrete-dark text-cement hover:border-black",
                )}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={cn("h-4 w-4", officialChecklist.includes(item.id) ? "text-emerald-600" : "text-zinc-300")} />
                  {item.label}
                </span>
                {item.id === PRACTICAL_CHECKLIST_ID && miniGameResult && (
                  <span
                    id="mini-game-practical-sync"
                    className="mt-1.5 block text-[9px] font-bold text-emerald-700"
                  >
                    Confirmado automaticamente pelo simulador prático.
                  </span>
                )}
              </button>
            ))}

            <div className={cn(
              "rounded-[2px] border-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest mt-2",
              allOfficialChecklistDone ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-cement bg-zinc-50 text-cement",
            )}>
              {allOfficialChecklistDone
                ? "Checklist oficial concluído. Liberação autorizada."
                : `Pendências no checklist oficial: ${OFFICIAL_COMPLETION_CHECKLIST.length - officialChecklist.length}`}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function TrainingProgressMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[2px] border-2 border-black bg-white dark:bg-concrete-dark px-3 py-2 text-left">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-0.5 text-xs font-black text-charcoal dark:text-off-white">{value}</p>
    </div>
  );
}
