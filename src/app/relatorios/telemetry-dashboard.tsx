"use client";

import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Activity, 
  TrendingUp,
  MousePointer2, 
  AlertCircle,
  Clock,
  Instagram,
  Copy,
  MessageSquare,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AuditLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type TelemetryDashboardProps = {
  telemetryData: AuditLogEntry[];
};

export function TelemetryDashboard({ telemetryData }: TelemetryDashboardProps) {
  // Aggregate data by event type
  const eventCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    telemetryData.forEach((entry) => {
      const metadata = entry.metadata as Record<string, unknown>;
      const event = (metadata?.event as string) || entry.action;
      counts[event] = (counts[event] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [telemetryData]);

  // Aggregate by day
  const dailyActivity = React.useMemo(() => {
    const daily: Record<string, number> = {};
    telemetryData.forEach((entry) => {
      const day = entry.createdAt.split("T")[0];
      daily[day] = (daily[day] || 0) + 1;
    });
    return Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));
  }, [telemetryData]);

  // Funnel calculations
  const funnel = React.useMemo(() => {
    const counts = {
      quick_sheet: 0,
      dm_copied: 0,
      instagram_opened: 0,
      response_recorded: 0
    };

    telemetryData.forEach((entry) => {
      const metadata = entry.metadata as Record<string, unknown>;
      const event = (metadata?.event as string) || entry.action;
      if (event === "quick_sheet_opened") counts.quick_sheet++;
      if (event === "dm_copied") counts.dm_copied++;
      if (event === "instagram_opened") counts.instagram_opened++;
      if (event === "contact.response_recorded" || event === "response_recorded") counts.response_recorded++;
    });

    return [
      { step: "Abriu Ficha", value: counts.quick_sheet, icon: MousePointer2, color: "bg-blue-500" },
      { step: "Copiou DM", value: counts.dm_copied, icon: Copy, color: "bg-indigo-500" },
      { step: "Abriu Instagram", value: counts.instagram_opened, icon: Instagram, color: "bg-pink-500" },
      { step: "Registrou Resposta", value: counts.response_recorded, icon: MessageSquare, color: "bg-emerald-500" },
    ];
  }, [telemetryData]);

  const totalEvents = telemetryData.length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Total de Eventos</p>
              <h3 className="text-2xl font-black text-zinc-900">{totalEvents}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-zinc-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Eficiência DM</p>
              <h3 className="text-2xl font-black text-indigo-950">
                {funnel[0].value > 0 ? Math.round((funnel[3].value / funnel[0].value) * 100) : 0}%
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Registros de Resposta</p>
              <h3 className="text-2xl font-black text-emerald-950">{funnel[3].value}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Abandono no Funil</p>
              <h3 className="text-2xl font-black text-rose-950">
                {funnel[2].value > funnel[3].value ? funnel[2].value - funnel[3].value : 0}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel Visualization */}
        <Card className="lg:col-span-7 border-zinc-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Funil de Atendimento Operacional</CardTitle>
            <CardDescription className="text-xs">Conversão agregada das etapas de abordagem.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {funnel.map((step, idx) => {
                const prevValue = idx > 0 ? funnel[idx-1].value : step.value;
                const dropRate = prevValue > 0 ? Math.round(((prevValue - step.value) / prevValue) * 100) : 0;
                const width = funnel[0].value > 0 ? Math.max((step.value / funnel[0].value) * 100, 5) : 0;

                return (
                  <div key={step.step} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg text-white", step.color)}>
                          <step.icon className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-black uppercase text-zinc-600 tracking-tight">{step.step}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-zinc-900">{step.value}</span>
                        {idx > 0 && dropRate > 0 && (
                          <Badge variant="outline" className="text-[9px] border-rose-100 text-rose-500 bg-rose-50/30">
                            -{dropRate}% perda
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", step.color)} 
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card className="lg:col-span-5 border-zinc-100 shadow-sm">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Distribuição por Evento</CardTitle>
            <CardDescription className="text-xs">Ações mais frequentes registradas.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-zinc-50">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Evento</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-6 h-10">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventCounts.slice(0, 10).map(([event, count]) => (
                  <TableRow key={event} className="border-zinc-50">
                    <TableCell className="px-6 py-3">
                      <span className="text-xs font-bold text-zinc-700 font-mono tracking-tight">{event}</span>
                    </TableCell>
                    <TableCell className="text-right px-6 py-3">
                      <span className="text-xs font-black text-zinc-900">{count}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart Placeholder */}
      <Card className="border-zinc-100 shadow-sm">
        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Atividade Diária (Agregada)</CardTitle>
          <CardDescription className="text-xs">Volume de interações operacionais nos últimos {dailyActivity.length} dias.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-32 flex items-end gap-1">
            {dailyActivity.map(([day, count]) => {
              const max = Math.max(...dailyActivity.map(d => d[1]), 1);
              const height = (count / max) * 100;
              return (
                <div key={day} className="flex-1 group relative">
                  <div 
                    className="w-full bg-zinc-200 hover:bg-indigo-500 transition-all rounded-t-sm" 
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] px-2 py-1 rounded-md z-10 whitespace-nowrap">
                    {day}: {count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-8 pt-4 border-t border-zinc-50">
            <span className="text-[10px] font-black uppercase text-zinc-400">{dailyActivity[0]?.[0]}</span>
            <span className="text-[10px] font-black uppercase text-zinc-400">{dailyActivity[dailyActivity.length-1]?.[0]}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Privacy Notice */}
      <div className="flex items-center gap-3 p-4 bg-zinc-950 text-white rounded-2xl">
        <Info className="h-5 w-5 text-indigo-400 shrink-0" />
        <p className="text-[10px] font-bold text-zinc-400 italic">
          Os dados apresentados são agregados e anônimos. Não registramos o conteúdo das mensagens enviadas ou recebidas, 
          apenas o fato operacional da ação ocorrida para fins de melhoria da usabilidade do sistema.
        </p>
      </div>
    </div>
  );
}
