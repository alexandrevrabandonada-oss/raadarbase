import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import {
  getSilenceRadarCorrectiveActionById,
  getCorrectiveActionImpact,
} from "@/lib/data/silence-radar-corrective-actions";
import { classifyCorrectiveActionImpact } from "@/lib/data/silence-radar-impact";
import { getCorrectiveActionTimeSeries } from "@/lib/data/silence-radar-time-series";
import { TimeSeriesChart } from "@/components/silence-radar/time-series-chart";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { completeCorrectiveActionServerAction, archiveCorrectiveActionServerAction } from "../actions";

export const dynamic = "force-dynamic";

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

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toMetricValues(targetType: string, baseline: Record<string, unknown>, impact: Awaited<ReturnType<typeof getCorrectiveActionImpact>>) {
  if (!impact) {
    return { baselineValue: null as number | null, currentValue: null as number | null, delta: null as number | null };
  }

  if (targetType === "bairro") {
    const baselineValue = Number(baseline.reportCount ?? 0);
    const currentValue = impact.currentReportCount;
    return { baselineValue, currentValue, delta: currentValue - baselineValue };
  }

  if (targetType === "pauta") {
    const baselineValue = Number(baseline.formCount ?? baseline.commentCount ?? 0);
    const currentValue = Number(baseline.formCount !== undefined ? impact.currentFormCount : impact.currentCommentCount);
    return { baselineValue, currentValue, delta: currentValue - baselineValue };
  }

  if (targetType === "post") {
    const baselineValue = Number(baseline.commentCount ?? 0);
    const currentValue = impact.currentCommentCount;
    return { baselineValue, currentValue, delta: currentValue - baselineValue };
  }

  return { baselineValue: null as number | null, currentValue: null as number | null, delta: null as number | null };
}

export default async function CorrectiveActionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireInternalPageSession("/radar/silencios/acoes/[id]");
  await requireRole(["admin", "operador"]);

  const { id } = await params;
  const action = await getSilenceRadarCorrectiveActionById(id);
  if (!action) notFound();

  const supabase = getSupabaseAdminClient();
  const [impact, timeSeries, actionAuditLogs, planAuditLogs] = await Promise.all([
    getCorrectiveActionImpact(id),
    getCorrectiveActionTimeSeries(id),
    supabase
      .from("audit_logs")
      .select("id,action,summary,created_at")
      .eq("entity_type", "silence_radar_corrective_actions")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    action.action_plan_item_id
      ? supabase
          .from("audit_logs")
          .select("id,action,summary,created_at")
          .eq("entity_type", "action_plan_items")
          .eq("entity_id", action.action_plan_item_id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (actionAuditLogs.error) {
    throw new Error(`Falha ao carregar audit logs da ação: ${actionAuditLogs.error.message}`);
  }

  if (planAuditLogs.error) {
    throw new Error(`Falha ao carregar audit logs do item de plano: ${planAuditLogs.error.message}`);
  }

  const baselineSnapshot = action.baseline_snapshot && typeof action.baseline_snapshot === "object"
    ? (action.baseline_snapshot as Record<string, unknown>)
    : {};

  const metricValues = toMetricValues(action.target_type, baselineSnapshot, impact);

  const impactStatus = classifyCorrectiveActionImpact({
    baseline: metricValues.baselineValue,
    current: metricValues.currentValue,
    delta: metricValues.delta,
    hasComparablePeriod: true,
  });

  const statusHistory = [
    { label: "Ação criada", at: action.created_at },
    action.status === "done" && action.completed_at ? { label: "Ação concluída", at: action.completed_at } : null,
    action.status === "archived" ? { label: "Ação arquivada", at: action.completed_at ?? action.created_at } : null,
  ].filter(Boolean) as Array<{ label: string; at: string }>;

  const relatedLogs = [...(actionAuditLogs.data ?? []), ...(planAuditLogs.data ?? [])]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  return (
    <AppShell>
      <PageHeader
        title={`Detalhe da ação corretiva`}
        description="Visão agregada de baseline, impacto e rastreabilidade operacional."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Button nativeButton={false} variant="outline" render={<Link href="/radar/silencios/acoes" />}>
          Voltar para ações
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/radar/silencios/impacto" />}>
          Ver impacto agregado
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Dados da ação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Tipo: </span>{KIND_LABELS[action.kind] ?? action.kind}</div>
            <div><span className="text-muted-foreground">Alvo: </span>{action.target_label} ({TARGET_LABELS[action.target_type] ?? action.target_type})</div>
            <div><span className="text-muted-foreground">Status: </span>{STATUS_LABELS[action.status] ?? action.status}</div>
            <div><span className="text-muted-foreground">Métrica de origem: </span>{action.source_metric}</div>
            <div><span className="text-muted-foreground">Criada em: </span>{formatDate(action.created_at)}</div>
            <div><span className="text-muted-foreground">Concluída em: </span>{formatDate(action.completed_at)}</div>
            <div>
              <span className="text-muted-foreground">Item de plano: </span>
              {action.action_plan_item_id ? (
                <Link href="/acoes" className="underline">ver item no plano</Link>
              ) : (
                "não vinculado"
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impacto atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Baseline: </span>{metricValues.baselineValue ?? "-"}</div>
            <div><span className="text-muted-foreground">Atual: </span>{metricValues.currentValue ?? "-"}</div>
            <div><span className="text-muted-foreground">Delta: </span>{metricValues.delta ?? "-"}</div>
            <div>
              <span className="text-muted-foreground">Status do impacto: </span>
              <Badge variant="outline">{impactStatus.replaceAll("_", " ")}</Badge>
            </div>

            {action.status !== "done" && action.status !== "archived" && (
              <div className="pt-2 flex gap-2">
                <form action={completeCorrectiveActionServerAction}>
                  <input type="hidden" name="id" value={action.id} />
                  <Button type="submit" size="sm" variant="outline">Concluir</Button>
                </form>
                <form action={archiveCorrectiveActionServerAction}>
                  <input type="hidden" name="id" value={action.id} />
                  <Button type="submit" size="sm" variant="ghost">Arquivar</Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Série temporal diária</CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeries ? (
              <TimeSeriesChart points={timeSeries.points} title={`Tendência de volume: ${timeSeries.trend}`} />
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados de série temporal disponíveis.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem histórico disponível.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {statusHistory.map((entry) => (
                  <li key={`${entry.label}-${entry.at}`} className="rounded-md border border-slate-200 px-3 py-2">
                    <p className="font-medium">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit logs relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            {relatedLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum audit log encontrado para esta ação.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {relatedLogs.map((log) => (
                  <li key={log.id} className="rounded-md border border-slate-200 px-3 py-2">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                    <p className="text-xs text-muted-foreground">{log.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
