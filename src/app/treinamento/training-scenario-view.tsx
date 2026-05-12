"use client";

import React from "react";
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, Info, AlertTriangle, Instagram, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingScenario } from "@/lib/data/training-phases";

interface TrainingScenarioViewProps {
  scenario: TrainingScenario;
  onScenarioComplete: () => void;
}

export function TrainingScenarioView({ scenario, onScenarioComplete }: TrainingScenarioViewProps) {
  const [completedStepIds, setCompletedStepIds] = React.useState<string[]>([]);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [simulatedPerson, setSimulatedPerson] = React.useState(scenario.person);

  const allStepsDone = completedStepIds.length === scenario.steps.length;

  const handleAction = (stepId: string) => {
    if (!completedStepIds.includes(stepId)) {
      setCompletedStepIds([...completedStepIds, stepId]);
    }
  };

  const handleTrainingAction = (action: string, payload?: unknown) => {
    console.log("Simulated Training Action:", action, payload);
    
    // Auto-complete steps based on sheet actions
    if (action === "dm_copied") {
      handleAction("copy");
    }
    if (action === "dm_sent") {
      handleAction("confirm");
      setSimulatedPerson({ ...simulatedPerson, status: "abordado" });
    }
    if (action === "response_recorded") {
      handleAction("select");
      setSimulatedPerson({ ...simulatedPerson, status: "respondeu" });
    }
    if (action === "person_referred") {
      handleAction("refer");
      setSimulatedPerson({ ...simulatedPerson, status: "contato_confirmado" });
    }
    if (action === "note_saved") {
      // Just log for now
    }
  };

  return (
    <div className="space-y-8">
      {/* Context Card */}
      <Card className="border-indigo-200 bg-indigo-50/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight">O Cenário</h3>
              </div>
              <p className="text-indigo-900 font-medium leading-relaxed">
                {scenario.context}
              </p>
              <div className="p-4 bg-white/60 rounded-2xl border border-indigo-100">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Seu Desafio:</p>
                <p className="text-sm font-bold text-indigo-900">{scenario.challenge}</p>
              </div>
            </div>

            {allStepsDone && (
              <Button 
                onClick={onScenarioComplete}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider h-14 px-8 shadow-xl shadow-indigo-200 animate-in zoom-in duration-300"
              >
                Concluir Fase <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Simulation Environment */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Simulação Ativa • Dados Reais Protegidos</p>
          </div>

          <Card className="border-zinc-200 shadow-xl bg-white overflow-hidden rounded-3xl min-h-[400px] flex items-center justify-center">
            <CardContent className="p-12 text-center space-y-8">
              <div className="space-y-4">
                <div className="h-24 w-24 rounded-full bg-zinc-100 mx-auto flex items-center justify-center text-4xl font-black text-zinc-400 border-4 border-white shadow-inner">
                  {simulatedPerson.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tight text-zinc-900">@{simulatedPerson.username}</h2>
                  <p className="text-zinc-500 font-medium">{simulatedPerson.displayName}</p>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button 
                  size="lg"
                  className={cn(
                    "font-black uppercase text-xs tracking-wider h-14 px-10 rounded-2xl transition-all",
                    simulatedPerson.status === "nao_abordar" ? "bg-rose-100 text-rose-600 border-rose-200 cursor-not-allowed" : "bg-zinc-950 hover:bg-zinc-800 text-white shadow-xl"
                  )}
                  onClick={() => {
                    if (simulatedPerson.status !== "nao_abordar") {
                      setIsSheetOpen(true);
                      handleAction("view");
                    }
                  }}
                >
                  <Instagram className="mr-3 h-5 w-5" />
                  {simulatedPerson.status === "nao_abordar" ? "Ação Bloqueada" : "Abrir Ficha Rápida"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Step List */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Passos para completar</h4>
          <div className="space-y-2">
            {scenario.steps.map((step) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300",
                  completedStepIds.includes(step.id) 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : "bg-white border-zinc-100"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2",
                  completedStepIds.includes(step.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-100 text-zinc-300"
                )}>
                  {completedStepIds.includes(step.id) ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                   <p className="text-sm font-bold">{step.label}</p>
                   {step.type === "info" && !completedStepIds.includes(step.id) && (
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="p-0 h-auto text-[10px] font-black uppercase text-indigo-600 hover:bg-transparent"
                       onClick={() => handleAction(step.id)}
                     >
                       Marcar como Lido
                     </Button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PersonQuickSheet 
        person={simulatedPerson}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        isTraining={true}
        onTrainingAction={handleTrainingAction}
      />
    </div>
  );
}
