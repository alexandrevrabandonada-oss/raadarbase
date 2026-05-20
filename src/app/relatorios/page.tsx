import Link from "next/link";
import AppShell from "@/components/app-shell";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listMobilizationReports } from "@/lib/data/reports";
import { formatDateTime } from "@/lib/mock-data";
import { FileText, Plus, LayoutDashboard, Activity } from "lucide-react";
import { getPilotDashboardData } from "@/lib/data/pilot-stats";
import { getCollectiveProgressMetrics } from "@/lib/data/collective-progress-data";
import { PilotDashboardClient } from "./pilot-dashboard-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { DailyClosure } from "@/components/radar/reports/daily-closure";
import { cn } from "@/lib/utils";
import { getOperationalTelemetry } from "@/lib/data/audit";
import { TelemetryDashboard } from "./telemetry-dashboard";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { listPilotFeedback } from "@/lib/data/audit";
import { getPilotFeedbackLoop } from "@/lib/data/pilot-feedback-loop";
import { PilotFeedbackForm, PilotFeedbackList } from "@/components/radar/reports/pilot-feedback";
import { getBaseQualityStats, detectPossibleDuplicates } from "@/lib/data/data-quality";
import { BaseQualityDashboard } from "@/components/radar/reports/base-quality";
import { listPeopleWithoutTheme } from "@/lib/data/people";
import { listInternalUsers } from "@/lib/data/internal-users";
import { calculateWeeklyRhythm } from "@/lib/data/weekly-rhythm";
import { WeeklyClosure } from "@/components/radar/reports/weekly-closure";
import { WeeklyRhythmCard } from "@/components/radar/weekly-rhythm-card";
import { CollectiveProgress } from "@/components/radar/reports/collective-progress";
import { getOperationalCycleAlerts } from "@/lib/data/operational-cycle-alerts";
import { CycleAlertList } from "@/components/radar/cycle-alert-list";


type FeaturedReportSnapshot = {
  totals?: {
    postsAnalyzed?: number;
    interactionsAnalyzed?: number;
    uniquePeople?: number;
    themesDetected?: number;
    pendingThemes?: number;
  };
  topTopics?: Array<Record<string, unknown>>;
};

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  await requireInternalPageSession("/relatorios");

  const reports = await listMobilizationReports();
  const pilotData = await getPilotDashboardData();
  const collectiveProgressMetrics = await getCollectiveProgressMetrics();
  const telemetryData = await getOperationalTelemetry(7);
  const pilotFeedback = await listPilotFeedback();
  const pilotFeedbackLoop = await getPilotFeedbackLoop();
  const qualityStats = await getBaseQualityStats();
  const duplicates = await detectPossibleDuplicates();
  const peopleWithoutTheme = await listPeopleWithoutTheme();
  const internalUsers = await listInternalUsers();
  const cycleAlerts = await getOperationalCycleAlerts();

  const generatedReports = reports.filter((report) => report.status === "generated");
  const firstRealReport = generatedReports
    .slice()
    .sort((left, right) => (left.created_at < right.created_at ? -1 : left.created_at > right.created_at ? 1 : 0))[0] ?? null;
  const firstSnapshot = (firstRealReport?.snapshot as FeaturedReportSnapshot) ?? null;
  const firstMetrics = firstSnapshot?.totals ?? {
    postsAnalyzed: 0,
    interactionsAnalyzed: 0,
    uniquePeople: 0,
    themesDetected: firstSnapshot?.topTopics?.length ?? 0,
    pendingThemes: 0,
  };

  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Resultados da Operação"
        title="Acompanhamento do Trabalho"
        description="Confira o desempenho do piloto e os aprendizados da mobilização."
      />

      <ContextHelpCard 
        title="Como analisar os resultados"
        whatIsThis="Este é o seu centro de inteligência. Aqui os dados individuais se transformam em visão estratégica da campanha."
        whyItMatters="Permite identificar quais temas estão gerando mais interesse e onde a equipe de campo está tendo mais sucesso."
        whatToDoNow="Navegue pelas abas para ver o ritmo da equipe hoje ou revise os relatórios de pautas para planejar as próximas ações."
        className="mb-8"
      />

      <CycleAlertList alerts={cycleAlerts.alerts} className="mb-6" />

      <Tabs defaultValue="operacional" className="space-y-6">
        <TabsList className="bg-charcoal/5 border-2 border-black h-auto flex flex-wrap gap-1 p-1 rounded-[2px]">
          <TabsTrigger value="operacional" className="data-[state=active]:bg-charcoal data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-transparent data-[state=active]:border-black rounded-[2px] transition-all text-charcoal">
            📊 Painel Piloto
          </TabsTrigger>
          <TabsTrigger value="fechamento" className="data-[state=active]:bg-charcoal data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-transparent data-[state=active]:border-black rounded-[2px] transition-all text-charcoal">
            ✅ Fechamento Dia
          </TabsTrigger>
          <TabsTrigger value="qualidade" className="data-[state=active]:bg-charcoal data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-transparent data-[state=active]:border-black rounded-[2px] transition-all text-charcoal">
            🧹 Qualidade
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="data-[state=active]:bg-charcoal data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-transparent data-[state=active]:border-black rounded-[2px] transition-all text-charcoal">
            📝 Pautas
          </TabsTrigger>
          <TabsTrigger value="ritmo" className="data-[state=active]:bg-charcoal data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-transparent data-[state=active]:border-black rounded-[2px] transition-all text-charcoal">
            ⚡ Ritmo
          </TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-charcoal data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-transparent data-[state=active]:border-black rounded-[2px] transition-all text-charcoal">
            💬 Voz da Equipe
          </TabsTrigger>
          <TabsTrigger value="retrospectiva" className="data-[state=active]:bg-charcoal data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-transparent data-[state=active]:border-black rounded-[2px] transition-all text-charcoal">
            🧠 Retrospectiva
          </TabsTrigger>
          <TabsTrigger value="progresso" className="data-[state=active]:bg-charcoal data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-transparent data-[state=active]:border-black rounded-[2px] transition-all text-charcoal">
            🚀 Progresso Coletivo
          </TabsTrigger>
        </TabsList>

        <div className="bloco-concreto bg-burnt-yellow/5 border-burnt-yellow p-4 mb-6">
           <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-[2px] border-2 border-black bg-burnt-yellow text-charcoal flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-charcoal mb-1">Dica Estratégica</p>
                <p className="text-sm text-charcoal font-medium leading-relaxed">
                  <strong>O que olhar primeiro?</strong> Comece pelo <strong>Fechamento do Dia</strong> para garantir que nada ficou parado. Depois, use a <strong>Qualidade da Base</strong> para garantir que a equipe está focada nos perfis certos.
                </p>
              </div>
           </div>
        </div>

        <TabsContent value="qualidade" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2 text-charcoal uppercase tracking-tight">
              <Activity className="w-5 h-5 text-charcoal" />
              Higiene e Qualidade da Base
            </h2>
          </div>
          <BaseQualityDashboard 
            stats={qualityStats} 
            duplicates={duplicates} 
            peopleWithoutTheme={peopleWithoutTheme}
            internalUsers={internalUsers}
          />
        </TabsContent>

        <TabsContent value="fechamento" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2 text-charcoal uppercase tracking-tight">
              <FileText className="w-5 h-5 text-charcoal" />
              Fechamento Diário Operacional
            </h2>
          </div>
          <DailyClosure 
            stats={{
              workedToday: pilotData.funnel.approached + pilotData.funnel.responded,
              dmsSent: pilotData.funnel.approached,
              responsesRecorded: pilotData.summary.responsesRecorded,
              referralsCreated: pilotData.funnel.referred,
              doNotContact: pilotData.summary.doNotContactCount,
              unassigned: pilotData.summary.tasksWithoutResponsible,
              pendingReferrals: pilotData.summary.pendingReferralsCount,
              stale: pilotData.summary.staleTasksCount,
              waiting3DaysCount: pilotData.summary.waiting3DaysCount,
              waiting7DaysCount: pilotData.summary.waiting7DaysCount,
              archivedWithoutReturnCount: pilotData.summary.archivedWithoutReturnCount
            }}
          />
        </TabsContent>

        <TabsContent value="retrospectiva" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2 text-charcoal uppercase tracking-tight">
              <FileText className="w-5 h-5 text-charcoal" />
              Retrospectiva e Aprendizado do Piloto
            </h2>
            <Button variant="outline" size="sm" className="hidden md:flex border-2 border-black bg-white text-charcoal rounded-[2px] font-black text-xs uppercase tracking-wider">
              Exportar Markdown
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bloco-concreto bg-white">
              <CardHeader className="pb-3 border-b-2 border-black">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Engajamento por Tema</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-charcoal/5 border-b-2 border-black">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Tema</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal text-right">Casos</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal text-right">Taxa de Resposta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pilotData.retrospective?.responseRateByTheme.map((t) => (
                      <TableRow key={t.theme} className="group hover:bg-charcoal/5 border-b border-black/10 transition-colors">
                        <TableCell className="font-black text-charcoal">{t.theme}</TableCell>
                        <TableCell className="text-right font-semibold text-cement">{t.count}</TableCell>
                        <TableCell className="text-right font-black text-moss">{t.rate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bloco-concreto bg-white">
              <CardHeader className="pb-3 border-b-2 border-black">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Motivos de &quot;Não Abordar&quot;</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-charcoal/5 border-b-2 border-black">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Motivo</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal text-right">Ocorrências</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pilotData.retrospective?.nonContactReasons.map((r) => (
                      <TableRow key={r.reason} className="group hover:bg-charcoal/5 border-b border-black/10 transition-colors">
                        <TableCell className="font-black text-charcoal">{r.reason}</TableCell>
                        <TableCell className="text-right text-rust font-black">{r.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card className="bloco-concreto bg-burnt-yellow/5 border-burnt-yellow">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Diário de Bordo e Aprendizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-charcoal">O que funcionou bem?</label>
                  <textarea className="w-full min-h-[100px] p-3 text-sm rounded-[2px] border-2 border-black bg-white font-semibold text-charcoal focus:ring-0 focus:outline-none" placeholder="Ex: Mensagens diretas sobre o tema X tiveram 50% de resposta..."></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-charcoal">O que precisa mudar?</label>
                  <textarea className="w-full min-h-[100px] p-3 text-sm rounded-[2px] border-2 border-black bg-white font-semibold text-charcoal focus:ring-0 focus:outline-none" placeholder="Ex: O template Y está gerando confusão..."></textarea>
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-charcoal text-white hover:bg-charcoal/90 rounded-[2px] border-2 border-black font-black uppercase text-xs tracking-wider">Salvar Reflexões da Semana</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-8">
           <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
              <div className="space-y-6">
                <PilotFeedbackForm currentRoute="/relatorios" />
                <Card className="bloco-concreto bg-burnt-yellow/5 border-burnt-yellow">
                  <CardContent className="pt-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-charcoal mb-2">Por que reportar?</h3>
                    <p className="text-xs text-charcoal/90 leading-relaxed font-semibold">
                      O piloto de 7 dias serve para encontrarmos onde o Radar atrapalha em vez de ajudar. Cada reporte seu vira uma melhoria para a próxima versão.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <PilotFeedbackList feedbacks={pilotFeedback || []} feedbackLoop={pilotFeedbackLoop} />
              </div>
           </div>
        </TabsContent>

        <TabsContent value="operacional" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2 text-charcoal uppercase tracking-tight">
              <LayoutDashboard className="w-5 h-5 text-charcoal" />
              Monitoramento Diário da Operação
            </h2>
            <div className="flex gap-2">
              <Button nativeButton={false} render={<a href="/api/piloto/export" target="_blank" rel="noreferrer" />} className="border-2 border-black bg-white text-charcoal font-black rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider" size="sm">
                Exportar CSV Completo
              </Button>
            </div>
          </div>
          <PilotDashboardClient data={pilotData} />
        </TabsContent>

        <TabsContent value="ritmo" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2 text-charcoal uppercase tracking-tight">
              <Activity className="w-5 h-5 text-charcoal" />
              Ritmo de Trabalho da Equipe
            </h2>
          </div>
          <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
            <div className="space-y-6">
              <WeeklyRhythmCard 
                state={calculateWeeklyRhythm({
                  dayOfWeek: new Date().getDay(),
                  tasksDistributed: pilotData.summary.tasksWithoutResponsible === 0,
                  prioritiesReviewed: true, // Placeholder
                  responsesRecordedCount: pilotData.summary.responsesRecorded,
                  referralsMadeCount: pilotData.funnel.referred,
                  stalePendenciesCount: pilotData.summary.staleTasksCount,
                  fieldActionsPlannedCount: 1,
                  weeklyClosureStarted: false
                })}
              />
              <ContextHelpCard 
                title="Ritmo da Semana"
                whatIsThis="Uma visão do progresso coletivo para garantir que a equipe mantenha um fluxo constante de escuta."
                whyItMatters="Evita o acúmulo de tarefas e garante que a mobilização territorial ocorra no tempo certo."
                whatToDoNow="Verifique as pendências críticas e ajude a fechar o ciclo da semana."
              />
            </div>
            <div className="space-y-6">
               <WeeklyClosure 
                  rhythm={calculateWeeklyRhythm({
                    dayOfWeek: new Date().getDay(),
                    tasksDistributed: pilotData.summary.tasksWithoutResponsible === 0,
                    prioritiesReviewed: true,
                    responsesRecordedCount: pilotData.summary.responsesRecorded,
                    referralsMadeCount: pilotData.funnel.referred,
                    stalePendenciesCount: pilotData.summary.staleTasksCount,
                    fieldActionsPlannedCount: 1,
                    weeklyClosureStarted: false
                  })}
                  stats={{
                    topThemes: pilotData.retrospective?.responseRateByTheme.slice(0, 3) || [],
                    territories: [
                      { name: "Centro", stage: "Campo", signals: 42 },
                      { name: "Vila Nova", stage: "Escuta", signals: 28 },
                      { name: "Jardins", stage: "Observação", signals: 15 }
                    ]
                  }}
               />
               <TelemetryDashboard telemetryData={telemetryData || []} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-cement font-semibold italic">
              Relatórios descrevem pautas, não perfis individuais.
            </div>
            <Button nativeButton={false} className="bg-burnt-yellow text-charcoal border-2 border-black rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:bg-burnt-yellow/90 font-black text-xs uppercase tracking-wider" render={<Link href="/relatorios/novo" />} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Relatório
            </Button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="bloco-concreto bg-burnt-yellow/5 border-burnt-yellow">
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-charcoal">Primeiro relatório real do Instagram</p>
                    <h2 className="mt-1 text-2xl font-black text-charcoal">{firstRealReport ? firstRealReport.title : "Ainda não gerado"}</h2>
                  </div>
                  <Badge className={cn(
                    "font-black text-[9px] uppercase tracking-widest rounded-[2px] border-2 border-black",
                    firstRealReport ? "bg-moss/10 text-moss" : "bg-charcoal/10 text-charcoal"
                  )}>{firstRealReport ? "gerado" : "pendente"}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-[2px] border-2 border-black bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-cement">Posts</p>
                    <p className="text-xl font-black text-charcoal">{firstMetrics.postsAnalyzed ?? 0}</p>
                  </div>
                  <div className="rounded-[2px] border-2 border-black bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-cement">Interações</p>
                    <p className="text-xl font-black text-charcoal">{firstMetrics.interactionsAnalyzed ?? 0}</p>
                  </div>
                  <div className="rounded-[2px] border-2 border-black bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-cement">Pessoas</p>
                    <p className="text-xl font-black text-charcoal">{firstMetrics.uniquePeople ?? 0}</p>
                  </div>
                  <div className="rounded-[2px] border-2 border-black bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-cement">Temas</p>
                    <p className="text-xl font-black text-charcoal">{firstMetrics.themesDetected ?? 0}</p>
                  </div>
                  <div className="rounded-[2px] border-2 border-black bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-cement">Penden.</p>
                    <p className="text-xl font-black text-charcoal">{firstMetrics.pendingThemes ?? 0}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {firstRealReport ? (
                    <>
                      <Button className="bg-charcoal text-white hover:bg-charcoal/90 rounded-[2px] border-2 border-black font-black uppercase text-xs tracking-wider" nativeButton={false} render={<Link href={`/relatorios/${firstRealReport.id}`} />}>Abrir relatório</Button>
                      <Button variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider" nativeButton={false} render={<Link href={`/acoes/novo?reportId=${firstRealReport.id}`} />}>Criar plano público</Button>
                    </>
                  ) : (
                    <Button className="bg-charcoal text-white hover:bg-charcoal/90 rounded-[2px] border-2 border-black font-black uppercase text-xs tracking-wider" nativeButton={false} render={<Link href="/relatorios/novo" />}>Gerar primeiro relatório</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bloco-concreto bg-moss/5 border-moss">
              <CardContent className="pt-6 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-moss">Estatísticas do Piloto (7 Dias)</p>
                  <h2 className="mt-1 text-lg font-black text-charcoal">Exportar Base Diária</h2>
                  <div className="text-xs font-semibold text-charcoal/90 mt-2 italic leading-relaxed">
                    Baixe o acompanhamento diário da operação (CSV).<br/>
                    Para saber quem assumiu cada tarefa, quantos foram encaminhados e o progresso real das abordagens.
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button nativeButton={false} render={<a href="/api/piloto/export" target="_blank" rel="noreferrer" />} className="bg-moss text-white hover:bg-moss/90 rounded-[2px] border-2 border-black font-black uppercase text-xs tracking-wider">
                    Baixar CSV do Piloto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bloco-concreto bg-white mt-6 overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-charcoal/5 border-b-2 border-black">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Título</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Status</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Período</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Gerado em</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Criado por</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="group hover:bg-charcoal/5 border-b border-black/10 transition-colors">
                      <TableCell className="font-black">
                        <Link href={`/relatorios/${report.id}`} className="flex items-center hover:underline text-charcoal">
                          <FileText className="mr-2 h-4 w-4 text-cement" />
                          {report.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            "font-black text-[9px] uppercase tracking-widest rounded-[2px] border-2 border-black",
                            report.status === 'generated' ? 'bg-moss/10 text-moss' : 
                            report.status === 'archived' ? 'bg-charcoal/10 text-charcoal' : 'bg-charcoal/10 text-charcoal'
                          )}
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-charcoal">
                        {report.period_start} a {report.period_end}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-charcoal">
                        {report.generated_at ? formatDateTime(report.generated_at) : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-cement">
                        {report.created_by_email}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" nativeButton={false} className="border-2 border-transparent text-charcoal hover:border-black font-black text-xs uppercase tracking-wider" render={<Link href={`/relatorios/${report.id}`} />}>
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center font-semibold text-cement">
                        Nenhum relatório criado ainda.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="progresso" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2 text-charcoal uppercase tracking-tight">
              <Activity className="w-5 h-5 text-charcoal" />
              Central de Progresso Coletivo
            </h2>
          </div>
          <CollectiveProgress data={collectiveProgressMetrics} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
