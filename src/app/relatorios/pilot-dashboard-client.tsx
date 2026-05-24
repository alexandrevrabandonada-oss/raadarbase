"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, MessageSquare, Reply, UserPlus, ShieldAlert, ArrowRight, History } from "lucide-react";
import type { PilotDashboardData } from "@/lib/data/pilot-stats";

// Radar Design System
import { RadarMetricCard } from "@/components/radar/radar-metric-card";
import { OperationalAlert } from "@/components/radar/operational-alert";


export function PilotDashboardClient({ data }: { data: PilotDashboardData }) {
  const { summary, responsibleBreakdown, funnel } = data;

  return (
    <div className="space-y-12">
      {/* Alertas Operacionais */}
      <div className="grid gap-4 md:grid-cols-2">
        {summary.pendingReferralsCount > 0 && (
          <OperationalAlert 
            type="precisa_encaminhar" 
            className="border-amber-100 bg-amber-50/50"
          />
        )}
        {summary.tasksWithoutResponsible > 0 && (
          <OperationalAlert 
            type="sem_responsavel" 
            className="border-indigo-100 bg-indigo-50/50"
          />
        )}
        {summary.staleTasksCount > 0 && (
          <OperationalAlert 
            type="contato_recente" // Using this as a proxy for stale tasks if needed or add a new one
            className="border-rose-100 bg-rose-50/50"
          />
        )}
        <OperationalAlert 
          type="webhook_quarentena" // Placeholder for general info/guardrail
          className="border-blue-100 bg-blue-50/50"
        />
      </div>

      {/* Indicadores do Dia */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Indicadores do Dia (Piloto 7 Dias)
        </h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <RadarMetricCard label="Priorizadas Hoje" value={summary.prioritizedToday} icon={Users} tone="neutral" />
          <RadarMetricCard label="Tarefas Abertas" value={summary.openTasks} icon={MessageSquare} tone="neutral" />
          <RadarMetricCard label="DMs Enviadas" value={summary.messagesSent} icon={ArrowRight} tone="info" />
          <RadarMetricCard label="Respostas" value={summary.responsesRecorded} icon={Reply} tone="success" />
          <RadarMetricCard label="Encaminhamentos" value={summary.referralsCreated} icon={UserPlus} tone="success" />
          <RadarMetricCard label="Não Abordar" value={summary.doNotContactCount} icon={ShieldAlert} tone="danger" />
          <RadarMetricCard label="Órfãs" value={summary.tasksWithoutResponsible} icon={Users} tone="indigo" href="/abordagem?filter=sem_responsavel" />

          <RadarMetricCard label="Paradas >48h" value={summary.staleTasksCount} icon={History} tone="warning" />
        </div>
      </div>


      {/* Funil de Conversão */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Funil de Vínculo (Acumulado)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <FunnelStep label="Priorizados" value={funnel.prioritized} />
            <ArrowRight className="hidden md:block text-slate-300" />
            <FunnelStep label="Abordados" value={funnel.approached} percentage={funnel.prioritized > 0 ? (funnel.approached / funnel.prioritized * 100).toFixed(0) : "0"} />
            <ArrowRight className="hidden md:block text-slate-300" />
            <FunnelStep label="Responderam" value={funnel.responded} percentage={funnel.approached > 0 ? (funnel.responded / funnel.approached * 100).toFixed(0) : "0"} />
            <ArrowRight className="hidden md:block text-slate-300" />
            <FunnelStep label="Encaminhados" value={funnel.referred} percentage={funnel.responded > 0 ? (funnel.referred / funnel.responded * 100).toFixed(0) : "0"} />
            <ArrowRight className="hidden md:block text-slate-300" />
            <FunnelStep label="1ª Ação" value={funnel.firstAction} percentage={funnel.referred > 0 ? (funnel.firstAction / funnel.referred * 100).toFixed(0) : "0"} />
          </div>
        </CardContent>
      </Card>

      {/* Quebra por Responsável */}
      <div>
        <h3 className="text-lg font-bold mb-4">Acompanhamento por Operador</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead className="text-center">Abertas</TableHead>
                <TableHead className="text-center">Concluídas</TableHead>
                <TableHead className="text-center">Respostas</TableHead>
                <TableHead className="text-center">Pend. Encaminhamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responsibleBreakdown.map((row) => (
                <TableRow key={row.operatorName}>
                  <TableCell className="font-medium">{row.operatorName}</TableCell>
                  <TableCell className="text-center">{row.openTasks}</TableCell>
                  <TableCell className="text-center">{row.completedTasks}</TableCell>
                  <TableCell className="text-center">{row.responsesRecorded}</TableCell>
                  <TableCell className="text-center">
                    {row.pendingReferrals > 0 ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">{row.pendingReferrals}</Badge>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {responsibleBreakdown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum operador com tarefas atribuídas.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
function FunnelStep({ label, value, percentage }: { label: string, value: number, percentage?: string }) {
  return (
    <div className="flex-1 text-center p-4 rounded-lg bg-white border border-slate-200 shadow-sm w-full md:w-auto">
      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      {percentage && <p className="text-[10px] font-bold text-emerald-600">+{percentage}% conv.</p>}
    </div>
  );
}
