"use client";

import React from "react";
import { 
  Users, 
  UserPlus, 
  Tags, 
  AlertCircle, 
  ShieldX, 
  Clock, 
  Search, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BaseQualityStats, DuplicateGroup } from "@/lib/data/data-quality";
import Link from "next/link";

export function BaseQualityDashboard({ stats, duplicates }: { stats: BaseQualityStats, duplicates: DuplicateGroup[] }) {
  
  const metricConfigs = [
    { label: "Sem Responsável", value: stats.unassignedCount, icon: UserPlus, color: "text-amber-600", bg: "bg-amber-50", link: "/pessoas?filter=sem_responsavel" },
    { label: "Possíveis Duplicatas", value: stats.possibleDuplicatesCount, icon: Search, color: "text-rose-600", bg: "bg-rose-50", link: "#duplicates" },
    { label: "Sem Tema Classificado", value: stats.noThemeCount, icon: Tags, color: "text-indigo-600", bg: "bg-indigo-50", link: "/pessoas" },
    { label: "Username Inválido", value: stats.invalidUsernameCount, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", link: "/pessoas" },
    { label: "Tarefa sem Dono", value: stats.taskNoResponsibleCount, icon: Clock, color: "text-zinc-600", bg: "bg-zinc-50", link: "/abordagem" },
    { label: "Não Abordar", value: stats.doNotContactCount, icon: ShieldX, color: "text-zinc-500", bg: "bg-zinc-100", link: "/pessoas?filter=nao_abordar" },
  ];

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricConfigs.map((m) => (
          <Card key={m.label} className="border-none shadow-sm ring-1 ring-zinc-100">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center mb-3", m.bg, m.color)}>
                <m.icon className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black text-zinc-900">{m.value}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{m.label}</span>
              {m.value > 0 && (
                <Link href={m.link} className="mt-3 text-[9px] font-black uppercase text-indigo-600 hover:underline flex items-center gap-1">
                  Revisar <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Hygiene Tips */}
        <Card className="border-none shadow-sm ring-1 ring-zinc-100 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Dicas de Higiene da Base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-black text-[10px]">1</div>
              <p className="text-sm text-emerald-900 font-medium leading-tight">Atribua um responsável para cada pessoa com score alto. Pessoas sem &quot;dono&quot; tendem a esfriar.</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-black text-[10px]">2</div>
              <p className="text-sm text-emerald-900 font-medium leading-tight">Revise os temas &quot;Desconhecidos&quot;. Classificar corretamente ajuda na inteligência do território.</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-black text-[10px]">3</div>
              <p className="text-sm text-emerald-900 font-medium leading-tight">Identifique duplicatas. Perfis diferentes podem pertencer à mesma pessoa no Instagram.</p>
            </div>
          </CardContent>
        </Card>

        {/* Actionable Tasks */}
        <Card className="border-none shadow-sm ring-1 ring-zinc-100">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-800">Próximas Limpezas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <Button variant="outline" className="w-full justify-between h-12 text-xs font-bold border-zinc-200">
                Atribuir responsáveis em lote
                <ArrowRight className="h-4 w-4 text-indigo-600" />
             </Button>
             <Button variant="outline" className="w-full justify-between h-12 text-xs font-bold border-zinc-200">
                Revisar pessoas sem tema (N/A)
                <ArrowRight className="h-4 w-4 text-indigo-600" />
             </Button>
             <Button variant="outline" className="w-full justify-between h-12 text-xs font-bold border-zinc-200">
                Validar usernames com espaços
                <ArrowRight className="h-4 w-4 text-indigo-600" />
             </Button>
          </CardContent>
        </Card>
      </div>

      {/* Duplicates Section */}
      <section id="duplicates" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Possíveis Duplicatas</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Identificamos perfis com handles ou nomes muito parecidos.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {duplicates.length === 0 ? (
            <Card className="border-dashed border-zinc-200 bg-zinc-50">
              <CardContent className="py-12 text-center text-zinc-400">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Base limpa! Nenhuma duplicata detectada.</p>
              </CardContent>
            </Card>
          ) : (
            duplicates.map((group, idx) => (
              <Card key={idx} className="border-zinc-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-rose-100 text-rose-700 border-none font-black text-[9px] uppercase tracking-tighter">
                      Motivo: {group.reason}
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                      <p className="text-[9px] font-black uppercase text-zinc-400 mb-1">Perfil Original</p>
                      <p className="text-sm font-black text-zinc-900">@{group.original.username}</p>
                      <p className="text-xs text-zinc-500 font-medium">{group.original.displayName || "Sem nome"}</p>
                    </div>
                    {group.duplicates.map((dup, dIdx) => (
                      <div key={dIdx} className="p-3 rounded-lg border border-rose-100 bg-rose-50/30 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase text-rose-400 mb-1">Possível Cópia</p>
                          <p className="text-sm font-black text-rose-900">@{dup.username}</p>
                          <p className="text-xs text-rose-500 font-medium">{dup.displayName || "Sem nome"}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest text-indigo-600" nativeButton={false} render={<Link href={`/pessoas/${dup.id}`} />}>
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
