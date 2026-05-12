"use client";

import * as React from "react";
import { 
  CheckCircle2, 
  Circle, 
  Info, 
  MapPin, 
  Users, 
  Target, 
  Calendar, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    id: "signals",
    title: "Identificar Sinais Mínimos",
    description: "Verificar se há pelo menos 10 pessoas identificadas ou pautas recorrentes no bairro.",
    icon: Target,
    category: "Validação"
  },
  {
    id: "sync",
    title: "Sincronizar e Revisar Temas",
    description: "Forçar atualização de interações e ajustar categorias de temas para a realidade local.",
    icon: Info,
    category: "Preparação"
  },
  {
    id: "assignment",
    title: "Distribuir Responsáveis",
    description: "Atribuir pessoas monitoradas aos operadores que cuidarão do território.",
    icon: Users,
    category: "Operação"
  },
  {
    id: "agenda",
    title: "Vincular Agenda de Campo",
    description: "Criar o primeiro evento (Banca ou Caminhada) para dar vazão aos encaminhamentos.",
    icon: Calendar,
    category: "Território"
  },
  {
    id: "guardrails",
    title: "Revisar Guardrails Éticos",
    description: "Garantir que a equipe está ciente das restrições de não-automação e privacidade.",
    icon: ShieldCheck,
    category: "Ética"
  }
];

export function NeighborhoodScaleChecklist() {
  const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);
  const [isExpanded, setIsExpanded] = React.useState(true);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const progress = Math.round((completedSteps.length / STEPS.length) * 100);

  return (
    <Card className="border-2 border-indigo-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
      <CardHeader className="bg-indigo-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-indigo-900 uppercase">
                Preparar Novo Bairro
              </CardTitle>
              <CardDescription className="text-indigo-600/70 font-bold text-[10px] uppercase tracking-widest">
                Checklist de Escala Territorial
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xl font-black text-indigo-600 leading-none">{progress}%</div>
              <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">concluído</div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-indigo-100 text-indigo-600"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-6">
          <div className="space-y-3">
            {STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const StepIcon = step.icon;
              
              return (
                <div 
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={cn(
                    "group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer select-none",
                    isCompleted 
                      ? "bg-emerald-50/50 border-emerald-100" 
                      : "bg-white border-zinc-100 hover:border-indigo-200 hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "mt-1 p-2 rounded-lg transition-colors",
                    isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  )}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-black tracking-tight",
                        isCompleted ? "text-emerald-900 line-through opacity-50" : "text-zinc-900"
                      )}>
                        {step.title}
                      </span>
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black uppercase tracking-tighter",
                        isCompleted ? "border-emerald-200 text-emerald-600" : "border-zinc-200 text-zinc-400"
                      )}>
                        {step.category}
                      </Badge>
                    </div>
                    <p className={cn(
                      "text-xs font-medium leading-relaxed",
                      isCompleted ? "text-emerald-700/60" : "text-zinc-500"
                    )}>
                      {step.description}
                    </p>
                  </div>

                  <div className="shrink-0 pt-1">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="h-6 w-6 text-zinc-200 group-hover:text-indigo-200" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Lembrete de Guardrail</span>
              <p className="text-xs font-bold text-amber-800/80 leading-tight">
                A abertura de um bairro exige responsabilidade. Não automatize contatos iniciais. O Radar é sobre escuta humana e territorial.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
