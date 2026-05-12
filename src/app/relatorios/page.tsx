 
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
        <TabsList className="bg-zinc-100 p-1 border border-zinc-200 h-12">
          <TabsTrigger value="operacional" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest px-6 h-10">
            📊 Painel Piloto
          </TabsTrigger>
          <TabsTrigger value="fechamento" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest px-6 h-10">
            ✅ Fechamento Dia
          </TabsTrigger>
          <TabsTrigger value="qualidade" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest px-6 h-10">
            🧹 Qualidade
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest px-6 h-10">
            📝 Pautas
          </TabsTrigger>
          <TabsTrigger value="ritmo" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest px-6 h-10">
            ⚡ Ritmo
          </TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest px-6 h-10">
            💬 Voz da Equipe
          </TabsTrigger>
          <TabsTrigger value="retrospectiva" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest px-6 h-10">
            🧠 Retrospectiva
          </TabsTrigger>
          <TabsTrigger value="progresso" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest px-6 h-10">
            🚀 Progresso Coletivo
          </TabsTrigger>
        </TabsList>

        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mb-6">
           <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Dica Estratégica</p>
                <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                  <strong>O que olhar primeiro?</strong> Comece pelo <strong>Fechamento do Dia</strong> para garantir que nada ficou parado. Depois, use a <strong>Qualidade da Base</strong> para garantir que a equipe está focada nos perfis certos.
                </p>
              </div>
           </div>
        </div>

        <TabsContent value="qualidade" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
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
            <h2 className="text-xl font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
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
            <h2 className="text-xl font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Retrospectiva e Aprendizado do Piloto
            </h2>
            <Button variant="outline" size="sm" className="hidden md:flex">
              Exportar Markdown
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Engajamento por Tema</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tema</TableHead>
                      <TableHead className="text-right">Casos</TableHead>
                      <TableHead className="text-right">Taxa de Resposta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pilotData.retrospective?.responseRateByTheme.map((t) => (
                      <TableRow key={t.theme}>
                        <TableCell className="font-medium">{t.theme}</TableCell>
                        <TableCell className="text-right text-slate-500">{t.count}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">{t.rate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Motivos de &quot;Não Abordar&quot;</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Ocorrências</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pilotData.retrospective?.nonContactReasons.map((r) => (
                      <TableRow key={r.reason}>
                        <TableCell className="font-medium">{r.reason}</TableCell>
                        <TableCell className="text-right text-red-600 font-bold">{r.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-indigo-50 border-indigo-100">
            <CardHeader>
              <CardTitle className="text-indigo-900">Diário de Bordo e Aprendizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-indigo-700">O que funcionou bem?</label>
                  <textarea className="w-full min-h-[100px] p-3 text-sm rounded-md border border-indigo-200 focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Mensagens diretas sobre o tema X tiveram 50% de resposta..."></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-indigo-700">O que precisa mudar?</label>
                  <textarea className="w-full min-h-[100px] p-3 text-sm rounded-md border border-indigo-200 focus:ring-2 focus:ring-indigo-500" placeholder="Ex: O template Y está gerando confusão..."></textarea>
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Salvar Reflexões da Semana</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-8">
           <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
              <div className="space-y-6">
                <PilotFeedbackForm currentRoute="/relatorios" />
                <Card className="border-indigo-100 bg-indigo-50/30">
                  <CardContent className="pt-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-700 mb-2">Por que reportar?</h3>
                    <p className="text-xs text-indigo-800 leading-relaxed">
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
            <h2 className="text-xl font-black flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-emerald-600" />
              Monitoramento Diário da Operação
            </h2>
            <div className="flex gap-2">
              <Button nativeButton={false} render={<a href="/api/piloto/export" target="_blank" rel="noreferrer" />} variant="outline" size="sm">
                Exportar CSV Completo
              </Button>
            </div>
          </div>
          <PilotDashboardClient data={pilotData} />
        </TabsContent>

        <TabsContent value="ritmo" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
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
            <div className="text-sm text-muted-foreground italic">
              Relatórios descrevem pautas, não perfis individuais.
            </div>
            <Button nativeButton={false} render={<Link href="/relatorios/novo" />} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Relatório
            </Button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Primeiro relatório real do Instagram</p>
                    <h2 className="mt-1 text-2xl font-black">{firstRealReport ? firstRealReport.title : "Ainda não gerado"}</h2>
                  </div>
                  <Badge variant={firstRealReport ? "default" : "outline"}>{firstRealReport ? "gerado" : "pendente"}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-xs uppercase text-muted-foreground">Posts analisados</p>
                    <p className="text-xl font-black">{firstMetrics.postsAnalyzed ?? 0}</p>
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-xs uppercase text-muted-foreground">Interações</p>
                    <p className="text-xl font-black">{firstMetrics.interactionsAnalyzed ?? 0}</p>
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-xs uppercase text-muted-foreground">Pessoas únicas</p>
                    <p className="text-xl font-black">{firstMetrics.uniquePeople ?? 0}</p>
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-xs uppercase text-muted-foreground">Temas detectados</p>
                    <p className="text-xl font-black">{firstMetrics.themesDetected ?? 0}</p>
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-xs uppercase text-muted-foreground">Pendências</p>
                    <p className="text-xl font-black">{firstMetrics.pendingThemes ?? 0}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {firstRealReport ? (
                    <>
                      <Button nativeButton={false} render={<Link href={`/relatorios/${firstRealReport.id}`} />}>Abrir relatório</Button>
                      <Button variant="outline" nativeButton={false} render={<Link href={`/acoes/novo?reportId=${firstRealReport.id}`} />}>Criar plano público</Button>
                    </>
                  ) : (
                    <Button nativeButton={false} render={<Link href="/relatorios/novo" />}>Gerar primeiro relatório</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-700/20 bg-emerald-50/50">
              <CardContent className="pt-6 h-full flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Estatísticas do Piloto (7 Dias)</p>
                  <h2 className="mt-1 text-lg font-black text-emerald-950">Exportar Base Diária</h2>
                  <div className="text-sm text-emerald-900 mt-2 italic leading-relaxed">
                    Baixe o acompanhamento diário da operação (CSV).<br/>
                    Para saber quem assumiu cada tarefa, quantos foram encaminhados e o progresso real das abordagens.
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button nativeButton={false} render={<a href="/api/piloto/export" target="_blank" rel="noreferrer" />} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                    Baixar CSV do Piloto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Gerado em</TableHead>
                    <TableHead>Criado por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-semibold">
                        <Link href={`/relatorios/${report.id}`} className="flex items-center hover:underline">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          {report.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            report.status === 'generated' ? 'default' : 
                            report.status === 'archived' ? 'secondary' : 'outline'
                          }
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {report.period_start} a {report.period_end}
                      </TableCell>
                      <TableCell className="text-xs">
                        {report.generated_at ? formatDateTime(report.generated_at) : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {report.created_by_email}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/relatorios/${report.id}`} />}>
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
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
            <h2 className="text-xl font-black flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Central de Progresso Coletivo
            </h2>
          </div>
          <CollectiveProgress data={collectiveProgressMetrics} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
