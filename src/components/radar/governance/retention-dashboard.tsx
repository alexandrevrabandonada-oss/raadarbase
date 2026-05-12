"use client";

import * as React from "react";
import { 
  ShieldCheck, 
  Trash2, 
  UserX, 
  Clock, 
  Heart, 
  MessageSquare,
  ArrowRight,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { BaseQualityStats } from "@/lib/data/data-quality";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function RetentionDashboard({ stats }: { stats: BaseQualityStats }) {
  const metrics = [
    {
      label: "Não Abordar",
      value: stats.doNotContactCount,
      icon: UserX,
      color: "text-rose-600",
      bg: "bg-rose-50",
      description: "Perfis com restrição total de contato."
    },
    {
      label: "Sem Interação > 6 meses",
      value: stats.eligibleForReviewCount,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      description: "Elegíveis para revisão ou arquivamento."
    },
    {
      label: "Contatos Consentidos",
      value: stats.consentedContactCount,
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      description: "PII (E-mail/Telefone) com base legal."
    },
    {
      label: "Voluntários Ativos",
      value: stats.consentedVolunteerCount,
      icon: Heart,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      description: "Colaboradores com cadastro confirmado."
    },
    {
      label: "Feedbacks Pendentes",
      value: stats.pendingFeedbackCount,
      icon: MessageSquare,
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Incidentes de governança aguardando revisão."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className="border-none shadow-sm ring-1 ring-zinc-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-lg", m.bg)}>
                    <Icon className={cn("h-4 w-4", m.color)} />
                  </div>
                  <span className="text-2xl font-black tracking-tight">{m.value}</span>
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-500 pt-2">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-zinc-400">{m.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-indigo-100 bg-indigo-50/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black uppercase text-indigo-900 tracking-tight">
                Governança de Dados
              </CardTitle>
              <CardDescription className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Proteção e Ciclo de Vida do Dado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-indigo-100 flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-800">Princípio da Minimização</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                O Radar de Base armazena apenas o necessário para a operação. Perfis sem interação e sem vínculo de voluntariado 
                há mais de 180 dias devem ser revisados para anonimização ou exclusão.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
             <Link 
                href="/relatorios/qualidade"
                className={cn(buttonVariants({ variant: "outline" }), "bg-white border-zinc-200 font-black uppercase text-[10px] tracking-widest h-10")}
             >
                Ver Qualidade da Base
                <ArrowRight className="ml-2 h-3 w-3" />
             </Link>
             <Button 
                variant="outline" 
                className="bg-white border-zinc-200 font-black uppercase text-[10px] tracking-widest h-10 text-rose-600 hover:text-rose-700"
             >
                <Trash2 className="mr-2 h-3 w-3" />
                Executar Limpeza Manual
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
