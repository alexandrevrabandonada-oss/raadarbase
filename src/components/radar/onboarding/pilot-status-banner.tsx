"use client";

import React from "react";
import { Flag, Calendar, Target, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PilotStatusBannerProps {
  currentDay: number;
  totalDays: number;
  pendingCriticals: number;
  className?: string;
}

export function PilotStatusBanner({ 
  currentDay, 
  totalDays, 
  pendingCriticals,
  className 
}: PilotStatusBannerProps) {
  
  const objectives = [
    "Ajuste fino de acessos e primeiro contato.",
    "Consistência no registro de respostas.",
    "Identificação de gargalos no fluxo de mensagens.",
    "Primeira rodada de encaminhamentos estratégicos.",
    "Revisão de temas recorrentes (Mapa de Assuntos).",
    "Estabilização da rotina de fechamento diário.",
    "Consolidação de aprendizados e feedback final."
  ];

  const currentObjective = objectives[currentDay - 1] || "Finalização do ciclo de aprendizado.";

  return (
    <Card className={cn("border-none shadow-lg bg-indigo-900 text-white overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Day Indicator */}
          <div className="bg-indigo-800 p-6 flex flex-col items-center justify-center min-w-[140px] border-b md:border-b-0 md:border-r border-indigo-700/50">
             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Piloto Ativo</span>
             <div className="flex items-baseline gap-1">
               <span className="text-4xl font-black">0{currentDay}</span>
               <span className="text-xl font-bold text-indigo-400">/0{totalDays}</span>
             </div>
             <span className="text-[10px] font-bold text-indigo-300 mt-1 uppercase">Dia de Operação</span>
          </div>

          {/* Info Area */}
          <div className="flex-1 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-400" />
                <h3 className="font-black text-lg">Objetivo de Hoje</h3>
              </div>
              <div className="flex items-center gap-2">
                {pendingCriticals > 0 && (
                  <Badge className="bg-rose-500 text-white border-none font-black text-[10px] uppercase animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {pendingCriticals} Pendências Críticas
                  </Badge>
                )}
                <Badge className="bg-indigo-700 text-indigo-100 border-none font-black text-[10px] uppercase">
                  <Calendar className="h-3 w-3 mr-1" />
                  Finaliza em 7 dias
                </Badge>
              </div>
            </div>

            <p className="text-sm text-indigo-100 font-medium leading-relaxed max-w-2xl">
              {currentObjective}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button nativeButton={false} size="sm" className="bg-white text-indigo-900 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest" render={<Link href="/relatorios" />}>
                Ir para Fechamento do Dia <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
              <Button nativeButton={false} size="sm" variant="ghost" className="text-indigo-200 hover:text-white hover:bg-indigo-800 font-black text-[10px] uppercase tracking-widest" render={<Link href="/docs/radar-de-base-freeze-piloto.md" />}>
                Ver Regras do Freeze
              </Button>
            </div>
          </div>

          {/* Status Icon Decoration */}
          <div className="hidden lg:flex items-center justify-center p-8 opacity-10">
            <Flag className="h-24 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
