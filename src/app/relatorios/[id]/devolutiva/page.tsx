import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getDevolutionPublicationByReportId } from "@/lib/data/devolution-publications";
import { getPublicDevolutiveKit } from "@/lib/data/report-devolutive";
import { getTerritorialListeningWindowByReportId } from "@/lib/data/territorial-listening-windows";
import { getMobilizationReport } from "@/lib/data/reports";
import { notFound } from "next/navigation";
import { SyncPlanButton } from "./sync-plan-button";
import { DevolutionPublicationControls } from "./publication-controls";

export const dynamic = "force-dynamic";

function methodBadge() {
  return (
    <Badge variant="outline" className="uppercase tracking-wider">
      Escuta pública por pauta, não perfilamento individual
    </Badge>
  );
}

export default async function RelatorioDevolutivaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ synced?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  await requireInternalPageSession(`/relatorios/${id}/devolutiva`);

  const report = await getMobilizationReport(id);
  if (!report) notFound();

  const kit = await getPublicDevolutiveKit(id);
  const publication = await getDevolutionPublicationByReportId(id);
  const territorialWindow = await getTerritorialListeningWindowByReportId(id);

  return (
    <AppShell>
      <PageHeader
        title={kit.publicTitle}
        description="Kit público para devolver a escuta agregada em linguagem simples, com carrossel, legenda, WhatsApp e chamada territorial."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button nativeButton={false} variant="outline" render={<Link href={`/relatorios/${id}`} />}>
          Voltar ao relatório
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href={`/api/reports/${id}/devolutiva?format=markdown`} />}>
          Exportar Markdown
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href={`/api/reports/${id}/devolutiva?format=html`} />}>
          Exportar HTML
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/escuta/bairro/admin" />}>
          Painel da escuta
        </Button>
        {kit.planId ? (
          <Button nativeButton={false} render={<Link href={`/acoes/${kit.planId}`} />}>
            Abrir plano de ação
          </Button>
        ) : null}
      </div>

      {query.synced ? (
        <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
          <AlertTitle>Plano atualizado</AlertTitle>
          <AlertDescription>
            O plano foi sincronizado com a devolutiva pública e os itens relevantes foram trazidos para o idioma pedido.
          </AlertDescription>
        </Alert>
      ) : null}

      <Alert className="mb-6 border-slate-300/60 bg-slate-50/70">
        <AlertTitle>Metodologia</AlertTitle>
        <AlertDescription>
          {kit.methodologyNotice} Use os textos abaixo apenas como devolutiva pública, sem usernames, comentários identificáveis, telefone, e-mail ou ranking de pessoas.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Checklist de publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Carrossel revisado",
              "Legenda revisada",
              "WhatsApp revisado",
              "Link da escuta testado",
              "Aviso de privacidade conferido",
              "Nenhum dado pessoal exposto",
              "Consentimento explícito funcionando",
              "Plano de ação vinculado",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-md border p-3">
                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status da publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="rounded-full border px-3 py-1">Status: {publication?.status ?? "draft"}</span>
              <span className="rounded-full border px-3 py-1">WhatsApp: {publication?.whatsapp_shared ? "sim" : "não"}</span>
            </div>
            <p>
              <strong>Publicada em:</strong> {publication?.published_at ?? "-"}
            </p>
            <p>
              <strong>URL publicada:</strong> {publication?.published_url ?? "-"}
            </p>
            <p>
              <strong>Post do Instagram:</strong> {publication?.instagram_post_url ?? "-"}
            </p>
            <p>
              <strong>Janela territorial:</strong> {territorialWindow ? "aberta" : "não aberta"}
            </p>
            {territorialWindow ? (
              <>
                <p>
                  <strong>Início da janela:</strong> {territorialWindow.startsAt}
                </p>
                <p>
                  <strong>Fim da janela:</strong> {territorialWindow.endsAt}
                </p>
                <p>
                  <strong>Dias restantes:</strong> {territorialWindow.daysRemaining ?? "-"}
                </p>
              </>
            ) : null}
            <DevolutionPublicationControls reportId={id} publication={publication} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resumo simples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{kit.summary}</p>
            <p>
              <strong>Período:</strong> {kit.periodStart ?? "-"} a {kit.periodEnd ?? "-"}
            </p>
            <div className="flex flex-wrap gap-2">{methodBadge()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano vinculado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-semibold">{kit.planTitle ?? "Plano não encontrado"}</p>
            <p className="text-muted-foreground">{kit.planLink}</p>
            {kit.planId ? <SyncPlanButton reportId={id} /> : null}
            {kit.relatedPlanItems.length > 0 ? (
              <div className="space-y-2 pt-2">
                {kit.relatedPlanItems.map((item) => (
                  <div key={item.id} className="rounded-md border p-3">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.type} • {item.status}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tópicos principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {kit.topics.map((topic) => (
              <div key={topic.name} className="rounded-md border p-3">
                <p className="font-semibold">{topic.name}</p>
                <p className="text-sm text-muted-foreground">
                  {topic.interactionCount} interações públicas • {topic.peopleCount} pessoas públicas
                </p>
              </div>
            ))}
            {kit.topics.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum tópico destacado.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carrossel 1:1</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {kit.carouselCards.map((card) => (
                <li key={card.number} className="rounded-md border p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card {card.number}</p>
                  <p className="mt-1 font-semibold">{card.text}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legenda Instagram</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-6">{kit.instagramCaption}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Texto para WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-6">{kit.whatsappText}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chamada para escuta de bairro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{kit.neighborhoodCall}</p>
            <Button nativeButton={false} render={<Link href={`/escuta/bairro?reportId=${id}`} />}>
              Abrir escuta de bairro
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aviso de metodologia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6">{kit.methodologyNotice}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}