"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Users, MessageSquare, Reply, UserPlus, ShieldAlert, Clock, ArrowRight } from "lucide-react";
import type { PilotDashboardData } from "@/lib/data/pilot-stats";

export function PilotDashboardClient({ data }: { data: PilotDashboardData }) {
  const { summary, responsibleBreakdown, funnel } = data;

  return (
    <div className="space-y-8">
      {/* Alertas Operacionais */}
      <div className="grid gap-4 md:grid-cols-2">
        {summary.pendingReferralsCount > 0 && (
          <Alert variant="default" className="border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Pendência de Encaminhamento</AlertTitle>
            <AlertDescription className="text-amber-700">
              Há <strong>{summary.pendingReferralsCount}</strong> pessoas que responderam e ainda não foram encaminhadas para uma ação ou grupo.
            </AlertDescription>
          </Alert>
        )}
        {summary.tasksWithoutResponsible > 0 && (
          <Alert variant="default" className="border-indigo-500 bg-indigo-50">
            <Users className="h-4 w-4 text-indigo-600" />
            <AlertTitle className="text-indigo-800">Tarefas Órfãs</AlertTitle>
            <AlertDescription className="text-indigo-700">
              Há <strong>{summary.tasksWithoutResponsible}</strong> tarefas abertas sem responsável atribuído.
            </AlertDescription>
          </Alert>
        )}
        {summary.staleTasksCount > 0 && (
          <Alert variant="destructive" className="border-red-500 bg-red-50 text-red-900">
            <Clock className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Tarefas Paradas</AlertTitle>
            <AlertDescription className="text-red-700">
              Há <strong>{summary.staleTasksCount}</strong> tarefas sem atualização há mais de 48 horas.
            </AlertDescription>
          </Alert>
        )}
        <Alert className="border-blue-500 bg-blue-50">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Lembrete de Privacidade</AlertTitle>
          <AlertDescription className="text-blue-700">
            Respeite sempre as pessoas marcadas como &quot;Não Abordar&quot;. Evite contatos repetitivos em janelas curtas.
          </AlertDescription>
        </Alert>
      </div>

      {/* Indicadores do Dia */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          Indicadores do Dia (Piloto 7 Dias)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Priorizadas Hoje" value={summary.prioritizedToday} icon={<Users className="w-4 h-4" />} />
          <StatCard title="Tarefas Abertas" value={summary.openTasks} icon={<MessageSquare className="w-4 h-4" />} />
          <StatCard title="DMs Enviadas" value={summary.messagesSent} icon={<ArrowRight className="w-4 h-4" />} />
          <StatCard title="Respostas" value={summary.responsesRecorded} icon={<Reply className="w-4 h-4" />} />
          <StatCard title="Encaminhamentos" value={summary.referralsCreated} icon={<UserPlus className="w-4 h-4" />} color="text-emerald-600" />
          <StatCard title="Não Abordar" value={summary.doNotContactCount} icon={<ShieldAlert className="w-4 h-4" />} color="text-red-600" />
          <StatCard title="Órfãs" value={summary.tasksWithoutResponsible} icon={<Users className="w-4 h-4" />} color="text-indigo-600" />
          <StatCard title="Paradas >48h" value={summary.staleTasksCount} icon={<Clock className="w-4 h-4" />} color="text-amber-600" />
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

function StatCard({ title, value, icon, color = "text-foreground" }: { title: string, value: number, icon: React.ReactNode, color?: string }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500">{title}</p>
          <p className={`text-2xl font-black ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
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
