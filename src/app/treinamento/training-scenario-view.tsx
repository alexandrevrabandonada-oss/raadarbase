"use client";

import React from "react";
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, Info, AlertTriangle, Instagram, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingScenario } from "@/lib/data/training-phases";
import { playSynthConfirm } from "@/lib/audio";

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
    <div className="space-y-6">
      {/* Context Card */}
      <Card className="bloco-concreto shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] bg-amber-50/50 dark:bg-concrete-dark">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="space-y-4 max-w-2xl text-charcoal dark:text-off-white">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-burnt-yellow" />
                <h3 className="text-lg font-black uppercase tracking-wider">O Cenário</h3>
              </div>
              <p className="font-bold text-sm leading-relaxed text-cement dark:text-zinc-300">
                {scenario.context}
              </p>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-850 border-2 border-black rounded-[2px]">
                <p className="text-[10px] font-black text-cement uppercase tracking-widest mb-1">Seu Desafio:</p>
                <p className="text-xs font-black text-charcoal dark:text-off-white">{scenario.challenge}</p>
              </div>
            </div>

            {allStepsDone && (
              <Button 
                onClick={() => {
                  onScenarioComplete();
                }}
                size="lg"
                className="w-full md:w-auto bg-burnt-yellow text-charcoal border-black rounded-[2px] font-black uppercase text-xs tracking-widest h-12 px-8 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)]"
              >
                Concluir Fase <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Simulation Environment */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFF7CD] border-2 border-black p-4 rounded-[2px] flex items-center gap-3 text-charcoal shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle className="h-5 w-5 shrink-0 text-charcoal" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-none">Simulação Ativa • Dados Reais Protegidos</p>
          </div>

          <Card className="bloco-concreto min-h-[380px] flex items-center justify-center">
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-4">
                <div className="h-20 w-20 rounded-[2px] border-2 border-black bg-zinc-100 mx-auto flex items-center justify-center text-3xl font-black text-charcoal">
                  {simulatedPerson.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-charcoal dark:text-off-white">@{simulatedPerson.username}</h2>
                  <p className="text-xs font-bold text-cement">{simulatedPerson.displayName}</p>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button 
                  size="default"
                  className={cn(
                    "font-black uppercase text-xs tracking-widest h-12 px-8 rounded-[2px] border-2 border-black",
                    simulatedPerson.status === "nao_abordar" ? "bg-rose-100 text-rose-600 border-rose-300 cursor-not-allowed" : "bg-burnt-yellow text-charcoal hover:bg-burnt-yellow/90"
                  )}
                  onClick={() => {
                    if (simulatedPerson.status !== "nao_abordar") {
                      playSynthConfirm();
                      setIsSheetOpen(true);
                      handleAction("view");
                    }
                  }}
                >
                  <Instagram className="mr-2 h-4 w-4" />
                  {simulatedPerson.status === "nao_abordar" ? "Ação Bloqueada" : "Abrir Ficha Rápida"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Step List */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-cement px-1">Passos para completar</h4>
          <div className="space-y-2">
            {scenario.steps.map((step) => {
              const isDone = completedStepIds.includes(step.id);
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[2px] border-2 transition-all duration-300",
                    isDone 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-600 text-emerald-800 dark:text-emerald-300" 
                      : "bg-zinc-50 dark:bg-zinc-900 border-cement text-charcoal dark:text-off-white"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-[2px] flex items-center justify-center shrink-0 border-2",
                    isDone ? "bg-emerald-500 border-black text-white" : "border-cement text-cement"
                  )}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                     <p className="text-xs font-black">{step.label}</p>
                     {step.type === "info" && !isDone && (
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="p-0 h-auto text-[9px] font-black uppercase text-burnt-yellow hover:text-dark-yellow hover:bg-transparent mt-1"
                         onClick={() => {
                           handleAction(step.id);
                           playSynthConfirm();
                         }}
                       >
                         Marcar como Lido
                       </Button>
                     )}
                  </div>
                </div>
              );
            })}
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
