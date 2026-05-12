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

export default function TrainingClient() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = React.useState(-1); // -1 is lobby
  const [completedPhases, setCompletedPhases] = React.useState<string[]>([]);
  const [ethicalChecks, setEthicalChecks] = React.useState<string[]>([]);
  const [officialChecklist, setOfficialChecklist] = React.useState<string[]>([]);
  const [isFinished, setIsFinished] = React.useState(false);
  const { showCompletion } = useCompletion();

  const currentPhase = currentPhaseIndex >= 0 ? TRAINING_PHASES[currentPhaseIndex] : null;
  const progress = Math.round(((completedPhases.length) / TRAINING_PHASES.length) * 100);

  const startPhase = (index: number) => {
    setCurrentPhaseIndex(index);
  };

  const handleScenarioComplete = () => {
    if (currentPhase && !completedPhases.includes(currentPhase.id)) {
      setCompletedPhases([...completedPhases, currentPhase.id]);
      showCompletion("training_phase_done");
    }
    setCurrentPhaseIndex(-1); // Back to lobby
  };

  const toggleEthicalCheck = (id: string) => {
    setEthicalChecks(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const allEthicalDone = ethicalChecks.length === ETHICAL_COMMITMENT.length;
  const allPhasesDone = completedPhases.length === TRAINING_PHASES.length;
  const allOfficialChecklistDone = officialChecklist.length === OFFICIAL_COMPLETION_CHECKLIST.length;

  const toggleOfficialChecklist = (id: string) => {
    setOfficialChecklist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // 1. Final Screen
  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-6 text-center space-y-8 animate-in zoom-in duration-500">
        <div className="h-24 w-24 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Operador Pronto!</h1>
          <p className="text-lg text-zinc-500 font-medium max-w-md mx-auto leading-relaxed">
            Você concluiu todas as fases do treinamento e assumiu o compromisso ético. A base real espera por você.
          </p>
        </div>
        <div className="pt-8">
           <Button 
             size="lg" 
             className="bg-zinc-950 hover:bg-zinc-900 text-white font-black uppercase text-xs tracking-wider h-14 px-12 shadow-xl"
             onClick={() => window.location.href = "/dashboard"}
           >
             Entrar na Fila Real <ChevronRight className="ml-2 h-5 w-5" />
           </Button>
        </div>
      </div>
    );
  }

  // 2. Scenario View
  if (currentPhase) {
    const scenario = TRAINING_SCENARIOS_DATA.find(s => s.id === currentPhase.scenarioId);
    return (
      <div className="max-w-5xl mx-auto py-8 px-6 space-y-8">
        <header className="flex items-center justify-between border-b border-zinc-100 pb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentPhaseIndex(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fase {currentPhaseIndex + 1} de {TRAINING_PHASES.length}</p>
              <h2 className="text-xl font-black tracking-tight">{currentPhase.title}</h2>
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
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12 pb-32">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
          <GraduationCap className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Trilha de Capacitação</span>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-zinc-950">Jornada do Operador</h1>
        <p className="text-xl text-zinc-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Complete as 6 fases para se tornar um operador certificado do Radar de Base.
        </p>
      </header>

      <section className="space-y-5">
        <div className="flex items-center gap-2 text-zinc-900">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-black uppercase tracking-wider">Pacote Oficial de Treinamento</h2>
        </div>

        <div className="grid gap-3">
          {OFFICIAL_TRAINING_MATERIALS.map((material) => (
            <Card key={material.id} className="border-zinc-200">
              <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-black text-zinc-900">{material.title}</p>
                  <p className="text-xs font-medium text-zinc-500">{material.description}</p>
                </div>
                <Button
                  nativeButton={false}
                  variant="outline"
                  className="h-9 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-700"
                  render={<Link href={material.href} target="_blank" />}
                >
                  Abrir Material <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Progress Bar Container */}
      <Card className="border-zinc-100 shadow-xl shadow-zinc-100/50 bg-white/50 backdrop-blur-sm sticky top-6 z-20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 mb-3">
             <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Progresso Geral</span>
             <span className="text-lg font-black text-indigo-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-zinc-100" indicatorClassName="bg-indigo-600 transition-all duration-1000" />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {TRAINING_PHASES.map((phase, index) => {
          const isCompleted = completedPhases.includes(phase.id);
          const isLocked = index > completedPhases.length;
          
          return (
            <button
              key={phase.id}
              disabled={isLocked}
              onClick={() => startPhase(index)}
              className={cn(
                "group relative flex items-center gap-6 p-6 rounded-3xl border-2 transition-all duration-300 text-left",
                isCompleted ? "bg-emerald-50 border-emerald-100" :
                isLocked ? "bg-zinc-50 border-transparent opacity-60 grayscale cursor-not-allowed" :
                "bg-white border-zinc-100 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1"
              )}
            >
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500",
                isCompleted ? "bg-emerald-500 text-white" :
                isLocked ? "bg-zinc-200 text-zinc-400" :
                "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6"
              )}>
                {isCompleted ? <CheckCircle2 className="h-8 w-8" /> : <phase.icon className="h-8 w-8" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Fase {index + 1}</p>
                   {isLocked && <Lock className="h-3 w-3 opacity-40" />}
                </div>
                <h3 className={cn(
                  "text-xl font-black tracking-tight",
                  isCompleted ? "text-emerald-900" : "text-zinc-900"
                )}>{phase.title}</h3>
                <p className="text-sm font-medium text-zinc-500 leading-snug">{phase.description}</p>
              </div>

              {!isCompleted && !isLocked && (
                <div className="h-12 w-12 rounded-full border-2 border-zinc-100 flex items-center justify-center text-zinc-300 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-colors">
                  <Play className="h-5 w-5 fill-current" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Ethical Commitment Section (Unlocked at the end) */}
      {allPhasesDone && (
        <section className="space-y-8 pt-12 animate-in slide-in-from-bottom-12 duration-1000">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight flex items-center justify-center gap-3">
              <ShieldCheck className="h-8 w-8 text-indigo-600" />
              Compromisso Ético
            </h2>
            <p className="text-zinc-500 font-medium">Confirme os guardrails obrigatórios para finalizar.</p>
          </div>

          <div className="grid gap-3 max-w-2xl mx-auto">
            {ETHICAL_COMMITMENT.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleEthicalCheck(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left",
                  ethicalChecks.includes(item.id) 
                    ? "bg-indigo-50 border-indigo-200 shadow-md" 
                    : "bg-white border-zinc-100 hover:border-indigo-200"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  ethicalChecks.includes(item.id) ? "bg-indigo-600 text-white" : "bg-zinc-50 text-zinc-400"
                )}>
                  {ethicalChecks.includes(item.id) ? <CheckCircle2 className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  ethicalChecks.includes(item.id) ? "text-indigo-900" : "text-zinc-600"
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              disabled={!allEthicalDone}
              className={cn(
                "font-black uppercase text-xs tracking-wider h-16 px-20 rounded-2xl transition-all shadow-2xl",
                allEthicalDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              )}
              onClick={() => {
                setIsFinished(true);
                showCompletion("training_finished");
              }}
            >
              Concluir Treinamento
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-5 pt-4">
        <div className="flex items-center gap-2 text-zinc-900">
          <ClipboardCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-black uppercase tracking-wider">Checklist de Conclusao Oficial</h2>
        </div>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-700">Liberacao para operacao real</CardTitle>
            <CardDescription>
              Este checklist garante treinamento oficial completo para novos operadores e alinhamento com coordenacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {OFFICIAL_COMPLETION_CHECKLIST.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleOfficialChecklist(item.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors",
                  officialChecklist.includes(item.id)
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                )}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={cn("h-4 w-4", officialChecklist.includes(item.id) ? "text-emerald-600" : "text-zinc-300")} />
                  {item.label}
                </span>
              </button>
            ))}

            <div className={cn(
              "rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest",
              allOfficialChecklistDone ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-500",
            )}>
              {allOfficialChecklistDone
                ? "Checklist oficial concluido. Pessoa pronta para onboarding formal."
                : `Pendencias no checklist oficial: ${OFFICIAL_COMPLETION_CHECKLIST.length - officialChecklist.length}`}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
