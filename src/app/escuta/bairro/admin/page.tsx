import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getTerritorialListeningWindowSummary } from "@/lib/data/territorial-listening-windows";
import { getTerritorialListeningAggregates, listTerritorialSnapshots } from "@/lib/data/territorial-listening-monitoring";
import { getTerritorialConversionMetrics, getTerritorialNewBatchConversionMetrics, listTerritorialOutreachLogs, getTerritorialOutreachSummary } from "@/lib/data/territorial-listening-outreach";
import {
  archiveTerritorialOutreachAction,
  createTerritorialOutreachLogAction,
  archiveTerritorialListeningWindowAction,
  closeTerritorialListeningWindowAction,
  generateTerritorialDailySnapshotAction,
  markTerritorialOutreachSharedAction,
} from "./actions";

export const dynamic = "force-dynamic";

const PUBLIC_LISTEN_LINKS = {
  geral: "/escuta/bairro",
  saude: "/escuta/bairro?pauta=saude",
  transporte: "/escuta/bairro?pauta=transporte",
  poluicao: "/escuta/bairro?pauta=poluicao",
  csn: "/escuta/bairro?pauta=csn",
} as const;

export default async function BairroAdminPage() {
  await requireInternalPageSession("/escuta/bairro/admin");
  const user = await requireRole(["admin", "operador"]);
  const windowSummary = await getTerritorialListeningWindowSummary();

  const activeWindow = windowSummary.activeWindow;
  const windowDaysRemaining = activeWindow?.daysRemaining ?? 0;
  const aggregates = activeWindow ? await getTerritorialListeningAggregates(activeWindow.id) : null;
  const snapshots = activeWindow ? await listTerritorialSnapshots(activeWindow.id) : [];
  const outreachLogs = activeWindow ? await listTerritorialOutreachLogs(activeWindow.id) : [];
  const outreachSummary = activeWindow ? await getTerritorialOutreachSummary(activeWindow.id) : { plannedCount: 0, sharedCount: 0, archivedCount: 0 };
  const newBatchConversion = activeWindow
    ? await getTerritorialNewBatchConversionMetrics(activeWindow.id)
    : {
      newBatchLogIds: [],
      newBatchLogs: [],
      newBatchSharedCount: 0,
      firstNewBatchSharedAt: null,
      reportsBeforeFirstNewBatchShared: 0,
      reportsAfterFirstNewBatchShared: 0,
      conversionDifferenceAbsolute: 0,
      conversionStatus: "no_shared_yet" as const,
    };
  const conversion = activeWindow
    ? await getTerritorialConversionMetrics(activeWindow.id)
    : {
      plannedCount: 0,
      sharedCount: 0,
      reportsBeforeFirstShared: 0,
      reportsAfterFirstShared: 0,
      differenceAbsolute: 0,
      firstSharedAt: null,
      status: "no_shared_yet" as const,
    };

  const summary = aggregates ?? {
    totalReports: 0,
    totalWithContactConsent: 0,
    totalWithoutContactConsent: 0,
    neighborhoodsCount: 0,
    topicsCount: 0,
    pendingReviewCount: 0,
    reviewedCount: 0,
    forwardedCount: 0,
    archivedCount: 0,
    topNeighborhoods: [],
    topTopics: [],
    status: "attention" as const,
    notes: "Aguardando snapshot diário.",
  };

  return (
    <AppShell>
      <PageHeader
        title="Painel da escuta por bairro"
        description="Visão agregada para acompanhar relatos, consentimento e encaminhamentos sem expor dados pessoais por padrão."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button nativeButton={false} variant="outline" render={<Link href="/escuta/bairro" />}>
          Abrir formulário público
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/api/escuta/bairro/export" />}>
          Exportar agregado CSV
        </Button>
        {activeWindow ? (
          <form action={generateTerritorialDailySnapshotAction.bind(null, activeWindow.id)}>
            <Button type="submit">Gerar snapshot diário</Button>
          </form>
        ) : null}
        {activeWindow ? (
          <form action={closeTerritorialListeningWindowAction.bind(null, activeWindow.id)}>
            <Button type="submit" variant="outline">
              Fechar janela
            </Button>
          </form>
        ) : null}
        {activeWindow ? (
          <form action={archiveTerritorialListeningWindowAction.bind(null, activeWindow.id)}>
            <Button type="submit" variant="outline">
              Arquivar janela
            </Button>
          </form>
        ) : null}
      </div>

      {activeWindow ? (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <CardTitle>Reforçar chamada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 lg:grid-cols-3">
              <ReinforcementCard
                title="Story/Instagram curto"
                subtitle="30 segundos: conte seu bairro e uma pauta urgente"
                cta="30 segundos: conte seu bairro e uma pauta urgente."
                privacy="Sem telefone nos comentarios. Use links com pauta pre-selecionada."
                channel="instagram_story"
                notes="Story de 30 segundos para reduzir atrito e aumentar participacao territorial real."
                windowId={activeWindow.id}
              />
              <ReinforcementCard
                title="WhatsApp"
                subtitle="Texto curto para grupos"
                cta="Estamos organizando uma escuta por bairro. Nao precisa mandar telefone. Basta dizer bairro + pauta + relato curto no formulario."
                privacy="Contato opcional apenas com consentimento explicito."
                channel="whatsapp"
                notes="Mensagem curta para grupos com foco em bairro + pauta + relato curto e sem coleta desnecessaria."
                windowId={activeWindow.id}
              />
              <div className="rounded-md border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card de reforço</p>
                <h3 className="mt-2 text-lg font-semibold">Qual problema do seu bairro precisa virar acao?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Fluxo rapido: bairro + pauta + relato curto. Sem dados pessoais no envio publico.</p>
                <div className="mt-4 rounded-md border bg-slate-50 p-3 text-sm">
                  <p className="font-medium">Links da chamada</p>
                  <div className="mt-2 grid gap-1 text-xs">
                    <Link href={PUBLIC_LISTEN_LINKS.geral} className="underline underline-offset-2">Escuta geral</Link>
                    <Link href={PUBLIC_LISTEN_LINKS.saude} className="underline underline-offset-2">Escuta saude</Link>
                    <Link href={PUBLIC_LISTEN_LINKS.transporte} className="underline underline-offset-2">Escuta transporte</Link>
                    <Link href={PUBLIC_LISTEN_LINKS.poluicao} className="underline underline-offset-2">Escuta poluicao / CSN</Link>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Contato e opcional e consentido. Sem nome, username, telefone, e-mail ou relato sensivel.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Alert className="mb-6 border-slate-300/60 bg-slate-50/70">
        <AlertTitle>Governança</AlertTitle>
        <AlertDescription>
          Contato opcional permanece redigido nesta tela. O painel é restrito a admin e operador e serve para organizar pauta, bairro e encaminhamento coletivo.
        </AlertDescription>
      </Alert>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Janela ativa"
          value={activeWindow ? "aberta" : "sem janela"}
          detail={activeWindow ? `${activeWindow.reportTitle} • ${activeWindow.status}` : "Aguardando publicação controlada."}
        />
        <MetricCard
          title="Dias restantes"
          value={activeWindow ? String(windowDaysRemaining) : "-"}
          detail={activeWindow ? `Encerra em ${activeWindow.endsAt}` : "Sem janela aberta no momento."}
        />
        <MetricCard title="Status da janela" value={activeWindow ? activeWindow.status : "sem janela"} detail={activeWindow ? "Monitoramento territorial em curso." : "Nenhuma janela em monitoramento."} />
        <MetricCard title="Snapshots criados" value={String(snapshots.length)} detail="Histórico diário da janela atual." />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total de relatos" value={String(summary.totalReports)} />
        <MetricCard title="Com consentimento" value={String(summary.totalWithContactConsent)} />
        <MetricCard title="Sem consentimento" value={String(summary.totalWithoutContactConsent)} />
        <MetricCard title="Pendentes de revisão" value={String(summary.pendingReviewCount)} />
        <MetricCard title="Encaminhados" value={String(summary.forwardedCount)} />
        <MetricCard title="Bairros citados" value={String(summary.neighborhoodsCount)} />
        <MetricCard title="Pautas citadas" value={String(summary.topicsCount)} />
        <MetricCard title="Status operacional" value={summary.status} detail={summary.notes ?? "Agregado diário disponível."} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Bairros mais citados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {summary.topNeighborhoods.map((item) => (
              <div key={item.bairro} className="flex items-center justify-between rounded-md border p-3">
                <span>{item.bairro}</span>
                <Badge variant="outline">{item.quantidade}</Badge>
              </div>
            ))}
            {summary.topNeighborhoods.length === 0 ? <p className="text-muted-foreground">Ainda não há bairros para agrupar.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pautas mais citadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {summary.topTopics.map((item) => (
              <div key={item.pauta} className="flex items-center justify-between rounded-md border p-3">
                <span>{item.pauta}</span>
                <Badge variant="outline">{item.quantidade}</Badge>
              </div>
            ))}
            {summary.topTopics.length === 0 ? <p className="text-muted-foreground">Ainda não há pautas para agrupar.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status de encaminhamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Revisados</span>
              <Badge variant="outline">{summary.reviewedCount}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Arquivados</span>
              <Badge variant="outline">{summary.archivedCount}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Pendentes</span>
              <Badge variant="outline">{summary.pendingReviewCount}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Janela territorial de monitoramento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {activeWindow ? (
            <div className="rounded-md border p-4">
              <p className="font-semibold">{activeWindow.reportTitle}</p>
              <p className="text-muted-foreground">
                {activeWindow.startsAt} → {activeWindow.endsAt}
              </p>
              <p className="text-muted-foreground">Dias restantes: {windowDaysRemaining}</p>
              <p className="text-muted-foreground">
                Plano vinculado: {activeWindow.actionPlanTitle ?? "não vinculado"}
              </p>
              <p className="text-muted-foreground">Status operacional: {summary.status}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma janela ativa no momento.</p>
          )}

          {snapshots.length > 0 ? (
            <div className="space-y-2 pt-2">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Snapshot {snapshot.snapshotDate}</p>
                      <p className="text-xs text-muted-foreground">
                        Gerado em {snapshot.generatedAt} • status {snapshot.status}
                      </p>
                    </div>
                    <Badge variant="outline">{snapshot.totalReports} relatos</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                    <span>Consentimento: {snapshot.totalWithContactConsent}</span>
                    <span>Sem consentimento: {snapshot.totalWithoutContactConsent}</span>
                    <span>Bairros: {snapshot.neighborhoodsCount}</span>
                    <span>Pautas: {snapshot.topTopics.length}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button nativeButton={false} variant="outline" render={<Link href={`/api/escuta/bairro/snapshots/${snapshot.id}/export?format=markdown`} />}>
                      Exportar Markdown
                    </Button>
                    <Button nativeButton={false} variant="outline" render={<Link href={`/api/escuta/bairro/snapshots/${snapshot.id}/export?format=html`} />}>
                      Exportar HTML
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reforços planejados e compartilhados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Planejados" value={String(outreachSummary.plannedCount)} detail="Reforços preparados internamente." />
            <MetricCard title="Compartilhados" value={String(outreachSummary.sharedCount)} detail="Reforços já publicados/compartilhados." />
            <MetricCard title="Arquivados" value={String(outreachSummary.archivedCount)} detail="Reforços descontinuados." />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Conversão (status)" value={formatConversionStatus(conversion.status)} detail={conversion.firstSharedAt ? `Primeiro shared: ${conversion.firstSharedAt}` : "Sem shared confirmado."} />
            <MetricCard title="Relatos antes do 1º shared" value={String(conversion.reportsBeforeFirstShared)} />
            <MetricCard title="Relatos após o 1º shared" value={String(conversion.reportsAfterFirstShared)} />
            <MetricCard title="Diferença absoluta" value={String(conversion.differenceAbsolute)} />
          </div>

          <div className="space-y-3 rounded-md border bg-slate-50 p-4">
            <p className="text-sm font-semibold">Conversão do novo lote</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Logs do novo lote" value={String(newBatchConversion.newBatchLogs.length)} />
              <MetricCard title="Shared do novo lote" value={String(newBatchConversion.newBatchSharedCount)} detail={newBatchConversion.firstNewBatchSharedAt ? `Primeiro shared: ${newBatchConversion.firstNewBatchSharedAt}` : "Sem confirmação do lote."} />
              <MetricCard title="Relatos antes" value={String(newBatchConversion.reportsBeforeFirstNewBatchShared)} />
              <MetricCard title="Relatos depois" value={String(newBatchConversion.reportsAfterFirstNewBatchShared)} />
              <MetricCard title="Delta" value={String(newBatchConversion.conversionDifferenceAbsolute)} />
              <MetricCard title="Status" value={formatConversionStatus(newBatchConversion.conversionStatus)} />
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              {newBatchConversion.newBatchLogs.map((log) => (
                <div key={log.id} className="rounded-md border bg-white p-2">
                  {log.id} • {log.channel} • {log.status} • {log.sharedAt ?? "sem shared"}
                </div>
              ))}
              {newBatchConversion.newBatchLogs.length === 0 ? <p>Sem logs associados ao novo lote no plano.</p> : null}
            </div>
          </div>

          <div className="space-y-3">
            {outreachLogs.map((log) => (
              <div key={log.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize">{log.channel.replaceAll("_", " ")}</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {log.status} • {log.createdAt}
                    </p>
                  </div>
                  <Badge variant="outline">{log.status}</Badge>
                </div>
                {log.notes ? <p className="mt-3 text-sm text-muted-foreground">{log.notes}</p> : null}
                {log.publicUrl ? <p className="mt-2 text-xs text-muted-foreground">URL pública: {log.publicUrl}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Relação com snapshot: {log.metadata && typeof log.metadata === "object" ? String((log.metadata as Record<string, unknown>).latest_snapshot_date ?? "-") : "-"}
                  {" "}
                  • {log.metadata && typeof log.metadata === "object" ? String((log.metadata as Record<string, unknown>).latest_snapshot_status ?? "-") : "-"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {log.status !== "shared" ? (
                    <form action={markTerritorialOutreachSharedAction.bind(null, log.id)} className="w-full space-y-3 rounded-md border bg-slate-50 p-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          name="public_url"
                          placeholder="https://... (opcional)"
                          className="h-9 rounded-md border bg-white px-3 text-sm"
                          defaultValue={log.publicUrl ?? ""}
                        />
                        <input
                          name="notes"
                          placeholder="Notas da publicação manual (opcional)"
                          className="h-9 rounded-md border bg-white px-3 text-sm"
                          defaultValue={log.notes ?? ""}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" name="manual_confirmation" required />
                        Confirmo que a divulgação foi feita manualmente por operador humano.
                      </label>
                      <Button type="submit" size="sm">Marcar compartilhado</Button>
                    </form>
                  ) : null}
                  {log.status !== "archived" ? (
                    <form action={archiveTerritorialOutreachAction.bind(null, log.id)}>
                      <Button type="submit" size="sm" variant="outline">Arquivar</Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
            {outreachLogs.length === 0 ? <p className="text-muted-foreground">Nenhum reforço registrado ainda.</p> : null}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-xs text-muted-foreground">
        Sessão interna ativa: {user.email ?? user.id}. Contato nunca aparece por padrão fora do redigido.
      </div>
    </AppShell>
  );
}

function formatConversionStatus(status: "no_shared_yet" | "waiting_results" | "conversion_detected" | "no_conversion_yet") {
  if (status === "conversion_detected") return "conversão detectada";
  if (status === "waiting_results") return "aguardando resposta";
  if (status === "no_conversion_yet") return "sem conversão ainda";
  return "sem shared";
}

function MetricCard({ title, value, detail }: { title: string; value: string; detail?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-3xl font-black">{value}</div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
        {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

function ReinforcementCard({
  title,
  subtitle,
  cta,
  privacy,
  channel,
  notes,
  windowId,
}: {
  title: string;
  subtitle: string;
  cta: string;
  privacy: string;
  channel: "instagram_story" | "whatsapp";
  notes: string;
  windowId: string;
}) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{channel.replaceAll("_", " ")}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-4 rounded-md border bg-slate-50 p-3 text-sm">
        <p>{cta}</p>
        <p className="mt-2 text-xs text-muted-foreground">{privacy}</p>
        <div className="mt-3 grid gap-1 text-xs">
          <Link href={PUBLIC_LISTEN_LINKS.geral} className="underline underline-offset-2">Escuta geral</Link>
          <Link href={PUBLIC_LISTEN_LINKS.saude} className="underline underline-offset-2">Escuta saude</Link>
          <Link href={PUBLIC_LISTEN_LINKS.transporte} className="underline underline-offset-2">Escuta transporte</Link>
          <Link href={PUBLIC_LISTEN_LINKS.poluicao} className="underline underline-offset-2">Escuta poluicao / CSN</Link>
        </div>
      </div>
      <form action={createTerritorialOutreachLogAction.bind(null, windowId)} className="mt-4 space-y-3">
        <input type="hidden" name="channel" value={channel} />
        <input type="hidden" name="notes" value={notes} />
        <Button type="submit" size="sm">Registrar reforço planejado</Button>
      </form>
    </div>
  );
}
