"use client";

import * as React from "react";
import { 
  ListChecks, 
  Instagram, 
  Copy, 
  MessageSquare, 
  UserPlus, 
  ArrowRight, 
  BookOpen,
  ShieldAlert,
  ArrowRightCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const onboardingSteps = [
  { id: 1, label: "Assuma suas tarefas", icon: UserPlus },
  { id: 2, label: "Abra a primeira pessoa", icon: BookOpen },
  { id: 3, label: "Copie a DM sugerida", icon: Copy },
  { id: 4, label: "Abra o Instagram", icon: Instagram },
  { id: 5, label: "Registre a resposta", icon: MessageSquare },
  { id: 6, label: "Encaminhe se houver interesse", icon: ArrowRight },
  { id: 7, label: "Passe para a próxima", icon: ArrowRightCircle },
];

const antiSpamTips = [
  { label: "Personalize a mensagem", description: "Use o nome da pessoa e mencione algo do comentário." },
  { label: "Espere a resposta", description: "Não envie múltiplas DMs seguidas sem retorno." },
  { label: "Respeite o silêncio", description: "Se não respondeu, não insista no mesmo dia." },
  { label: "Registre tudo", description: "O Radar só funciona se você marcar o que aconteceu." },
  { label: "Não peça voto", description: "O foco é mobilização e diálogo, não propaganda direta." },
];

export function GuidedOnboarding({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card className="border-indigo-100 bg-indigo-50/30 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-indigo-950">Hoje, faça nesta ordem:</h3>
                <p className="text-[10px] font-bold text-indigo-700/60 uppercase tracking-widest">Guia rápido do piloto</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {onboardingSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-1.5 bg-white border border-indigo-100 px-2 py-1 rounded-md shadow-sm">
                  <span className="text-[10px] font-black text-indigo-400">0{step.id}</span>
                  <span className="text-[10px] font-bold text-zinc-600">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 shadow-xl shadow-indigo-100/50">
        <CardHeader className="bg-indigo-600 text-white pb-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Badge className="bg-indigo-400/30 text-indigo-100 border-none uppercase text-[10px] font-black">Piloto 7 Dias</Badge>
              <CardTitle className="text-xl font-black">Hoje, faça nesta ordem:</CardTitle>
            </div>
            <ListChecks className="h-10 w-10 text-indigo-300 opacity-50" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-100">
            {onboardingSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                  {step.id}
                </div>
                <div className="flex items-center gap-3">
                  <step.icon className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-bold text-zinc-800">{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-900">
            <ShieldAlert className="h-4 w-4" />
            Como trabalhar sem parecer spam
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {antiSpamTips.map((tip) => (
              <div key={tip.label} className="space-y-1">
                <h4 className="text-xs font-black text-amber-900">{tip.label}</h4>
                <p className="text-[10px] text-amber-800/70 leading-relaxed font-medium">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
