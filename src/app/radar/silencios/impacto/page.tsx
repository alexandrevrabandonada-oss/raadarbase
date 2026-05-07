import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getSilenceRadarImpactDashboard, type CorrectiveActionImpactStatus } from "@/lib/data/silence-radar-impact";
import { getSilenceImpactTimeSeries } from "@/lib/data/silence-radar-time-series";
import { TimeSeriesChart } from "@/components/silence-radar/time-series-chart";
import { listTerritorialListeningWindows } from "@/lib/data/territorial-listening-windows";

export const dynamic = "force-dynamic";

const KIND_OPTIONS = [
  ["all", "Todos os tipos"],
  ["reforco_bairro", "Reforço por bairro"],
  ["explicacao_pauta", "Explicação de pauta"],
  ["pergunta_publica", "Pergunta pública"],
  ["roda_escuta", "Roda de escuta"],
  ["card_explicativo", "Card explicativo"],
] as const;

const TARGET_OPTIONS = [
  ["all", "Todos os alvos"],
  ["bairro", "Bairro"],
  ["pauta", "Pauta"],
  ["post", "Post"],
  ["janela", "Janela"],
] as const;

const STATUS_OPTIONS = [
  ["all", "Todos os status"],
  ["planned", "Planejada"],
  ["doing", "Em andamento"],
  ["done", "Concluída"],
  ["archived", "Arquivada"],
] as const;

const IMPACT_OPTIONS: Array<[CorrectiveActionImpactStatus | "all", string]> = [
  ["all", "Todos os impactos"],
  ["melhoria", "Melhoria"],
  ["estavel", "Estável"],
  ["atencao", "Atenção"],
  ["sem_dados_suficientes", "Sem dados suficientes"],
];

const WINDOW_SCOPE_OPTIONS = [
  ["all", "Todas as janelas"],
  ["active", "Janela territorial ativa"],
  ["historical", "Janelas históricas"],
] as const;

const KIND_LABELS: Record<string, string> = {
  reforco_bairro: "Reforço por bairro",
  explicacao_pauta: "Explicação de pauta",
  pergunta_publica: "Pergunta pública",
  roda_escuta: "Roda de escuta",
  card_explicativo: "Card explicativo",
};

const TARGET_LABELS: Record<string, string> = {
  bairro: "Bairro",
  pauta: "Pauta",
  post: "Post",
  janela: "Janela",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planejada",
  doing: "Em andamento",
  done: "Concluída",
  archived: "Arquivada",
};

const IMPACT_LABELS: Record<CorrectiveActionImpactStatus, string> = {
  melhoria: "melhoria",
  estavel: "estável",
  atencao: "atenção",
  sem_dados_suficientes: "sem dados suficientes",
};

function parseSafe(value: string | undefined, fallback = "all") {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function pickOption<T extends string>(
  value: string,
  options: ReadonlyArray<readonly [T, string]>,
  fallback: T,
): T {
  return options.some(([option]) => option === value) ? (value as T) : fallback;
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("pt-BR");
}

function formatDeltaPercent(deltaPercent: number | null) {
  if (deltaPercent === null) return "-";
  const value = deltaPercent.toFixed(1);
  return `${value}%`;
}

export default async function SilenceRadarImpactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInternalPageSession("/radar/silencios/impacto");
  await requireRole(["admin", "operador"]);

  const sp = await searchParams;
  const kind = parseSafe(typeof sp.kind === "string" ? sp.kind : undefined);
  const targetType = parseSafe(typeof sp.targetType === "string" ? sp.targetType : undefined);
  const status = parseSafe(typeof sp.status === "string" ? sp.status : undefined);
  const impact = parseSafe(typeof sp.impact === "string" ? sp.impact : undefined);
  const from = typeof sp.from === "string" ? sp.from : "";
  const to = typeof sp.to === "string" ? sp.to : "";
  const territorialWindowScope = parseSafe(typeof sp.territorialWindowScope === "string" ? sp.territorialWindowScope : undefined);
  const territorialWindowId = typeof sp.territorialWindowId === "string" ? sp.territorialWindowId : "";

  const kindFilter = pickOption(kind, KIND_OPTIONS, "all");
  const targetTypeFilter = pickOption(targetType, TARGET_OPTIONS, "all");
  const statusFilter = pickOption(status, STATUS_OPTIONS, "all");
  const impactFilter = pickOption(impact, IMPACT_OPTIONS, "all");
  const territorialWindowScopeFilter = pickOption(territorialWindowScope, WINDOW_SCOPE_OPTIONS, "all");

  const [dashboard, timeSeries, windows] = await Promise.all([
    getSilenceRadarImpactDashboard({
      kind: kindFilter,
      targetType: targetTypeFilter,
      status: statusFilter,
      impact: impactFilter,
      from: from || null,
      to: to || null,
      territorialWindowScope: territorialWindowScopeFilter,
      territorialWindowId: territorialWindowId || null,
    }),
    getSilenceImpactTimeSeries({
      kind: kindFilter,
      targetType: targetTypeFilter,
      status: statusFilter,
      from: from || null,
      to: to || null,
      territorialWindowScope: territorialWindowScopeFilter,
      territorialWindowId: territorialWindowId || null,
    }),
    listTerritorialListeningWindows(30),
  ]);

  const { summary, rows } = dashboard;

  return (
    <AppShell>
      <PageHeader
        title="Impacto das Ações Corretivas"
        description="Medição agregada de impacto por ação, alvo e período. Sem PII, sem relato bruto e sem classificação individual."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button nativeButton={false} variant="outline" render={<Link href="/radar/silencios" />}>
          Radar de Silêncios
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/radar/silencios/acoes" />}>
          Ações corretivas
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/api/radar/silencios/impacto/export" />}>
          Exportar CSV seguro
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/api/radar/silencios/impacto/export?format=markdown" />}>
          Exportar Markdown seguro
        </Button>
      </div>

      <form className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-muted-foreground">
          Tipo de ação
          <select name="kind" defaultValue={kind} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">
            {KIND_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Target type
          <select name="targetType" defaultValue={targetType} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">
            {TARGET_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Status
          <select name="status" defaultValue={status} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Impacto
          <select name="impact" defaultValue={impact} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">
            {IMPACT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          De
          <input type="date" name="from" defaultValue={from} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm" />
        </label>

        <label className="text-xs text-muted-foreground">
          Até
          <input type="date" name="to" defaultValue={to} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm" />
        </label>

        <label className="text-xs text-muted-foreground">
          Janela territorial
          <select name="territorialWindowScope" defaultValue={territorialWindowScope} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">
            {WINDOW_SCOPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Janela específica
          <select name="territorialWindowId" defaultValue={territorialWindowId} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">
            <option value="">Todas</option>
            {windows.map((window) => (
              <option key={window.id} value={window.id}>
                {window.reportTitle} ({new Date(window.startsAt).toLocaleDateString("pt-BR")})
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 xl:col-span-4 flex gap-2">
          <Button type="submit" variant="secondary">Aplicar filtros</Button>
          <Button nativeButton={false} type="button" variant="outline" render={<Link href="/radar/silencios/impacto" />}>
            Limpar
          </Button>
        </div>
      </form>

      <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Ações criadas</p><p className="text-2xl font-black">{summary.createdActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Ações concluídas</p><p className="text-2xl font-black">{summary.completedActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Relatos antes/depois</p><p className="text-2xl font-black">{summary.reportsBefore} → {summary.reportsAfter}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Interações antes/depois</p><p className="text-2xl font-black">{summary.interactionsBefore} → {summary.interactionsAfter}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Pautas com melhoria</p><p className="text-2xl font-black">{summary.topicsWithImprovement}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Bairros ainda silenciosos</p><p className="text-2xl font-black">{summary.stillSilentNeighborhoods}</p></CardContent></Card>
      </div>

      {dashboard.stillSilentTargets.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="text-base">Bairros ainda silenciosos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dashboard.stillSilentTargets.map((target) => (
                <Badge key={target} variant="outline">{target}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total de ações</p><p className="text-xl font-bold">{summary.totalActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Planejadas</p><p className="text-xl font-bold">{summary.plannedActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Em andamento</p><p className="text-xl font-bold">{summary.doingActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Concluídas</p><p className="text-xl font-bold">{summary.doneActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Arquivadas</p><p className="text-xl font-bold">{summary.archivedActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Impacto positivo</p><p className="text-xl font-bold">{summary.positiveImpactActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Sem mudança</p><p className="text-xl font-bold">{summary.unchangedActions}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Nova tentativa</p><p className="text-xl font-bold">{summary.retryNeededActions}</p></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Série temporal do impacto</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart points={timeSeries.points} title={`Tendência de volume: ${timeSeries.trend}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de impacto por ação</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ação encontrada com os filtros atuais.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Alvo</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Baseline</th>
                    <th className="py-2 pr-3">Atual</th>
                    <th className="py-2 pr-3">Delta</th>
                    <th className="py-2 pr-3">Delta %</th>
                    <th className="py-2 pr-3">Criação</th>
                    <th className="py-2 pr-3">Conclusão</th>
                    <th className="py-2 pr-3">Plano</th>
                    <th className="py-2 pr-3">Impacto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.actionId} className="border-b align-top">
                      <td className="py-2 pr-3">{KIND_LABELS[row.kind] ?? row.kind}</td>
                      <td className="py-2 pr-3">
                        <div className="font-medium">{row.targetLabel}</div>
                        <div className="text-xs text-muted-foreground">{TARGET_LABELS[row.targetType] ?? row.targetType}</div>
                      </td>
                      <td className="py-2 pr-3">{STATUS_LABELS[row.status] ?? row.status}</td>
                      <td className="py-2 pr-3">{row.baselineValue ?? "-"}</td>
                      <td className="py-2 pr-3">{row.currentValue ?? "-"}</td>
                      <td className="py-2 pr-3">{row.deltaAbsolute ?? "-"}</td>
                      <td className="py-2 pr-3">{formatDeltaPercent(row.deltaPercent)}</td>
                      <td className="py-2 pr-3">{formatDate(row.createdAt)}</td>
                      <td className="py-2 pr-3">{formatDate(row.completedAt)}</td>
                      <td className="py-2 pr-3">
                        {row.actionPlanItemId ? (
                          <Link className="underline" href={`/radar/silencios/acoes/${row.actionId}`}>
                            item vinculado
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{IMPACT_LABELS[row.impactStatus]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
