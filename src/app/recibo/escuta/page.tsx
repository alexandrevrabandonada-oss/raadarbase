import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicListeningReceipt } from "@/lib/data/public-listening-receipt";
import { getInternalSession } from "@/lib/supabase/auth";
import { DistributionPanel } from "./distribution-panel";
import { listReceiptDistributionLogs } from "@/lib/data/public-receipt-distribution";

export const dynamic = "force-dynamic";

export default async function PublicListeningReceiptPage() {
  const receipt = await getPublicListeningReceipt();

  const session = await getInternalSession();
  const isInternal = !!session && ["admin", "operador"].includes(session.internalUser.role);
  const distributionLogs = isInternal ? await listReceiptDistributionLogs() : [];

  const shareText = `O projeto Radar de Base publicou o Recibo de Escuta! Entre ${receipt.periodStart} e ${receipt.periodEnd}, ouvimos a população e convertemos isso em ações reais. Foram ${receipt.actions.totalActions} ações corretivas criadas a partir das demandas. Veja o que está sendo feito, de forma transparente e segura: [Link]\nParticipe você também: [Link do formulário]`;
  const shareLegend = `Aqui prestamos contas! 📢\nEstes são dados agregados da nossa escuta pública entre ${receipt.periodStart} e ${receipt.periodEnd}. Já criamos ${receipt.actions.totalActions} ações corretivas reais. Veja o que ouvimos e o que está sendo feito, sempre com total segurança aos seus dados.\n👉 Participe você também pelo nosso formulário online (link na bio/stories)!\n\n#EscutaAtiva #RadarDeBase #MissaoELuta #PrestacaoDeContas #ParticipacaoPublica`;

  return (
    <AppShell>
      <PageHeader
        title="Recibo Público da Escuta"
        description="A prestação de contas transparente do Radar de Base. Veja o que foi ouvido e o que estamos fazendo."
      />

      <div className="mb-6 rounded-md bg-amber-50 p-4 border border-amber-200">
        <p className="text-sm font-medium text-amber-800">
          Este recibo mostra dados agregados de escuta pública. Não identifica pessoas, não exibe comentários brutos e não usa perfilamento individual.
        </p>
      </div>

      <div className="mb-6 flex gap-3 flex-wrap">
        <Button nativeButton={false} variant="outline" render={<Link href="/api/recibo/escuta/card?format=1x1" target="_blank" />} title="Ideal para Feed">
          Baixar card 1:1
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/api/recibo/escuta/card?format=3x4" target="_blank" />} title="Ideal para Stories">
          Baixar card 3:4
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/api/recibo/escuta/export?format=html" />}>
          Versão para impressão (HTML)
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/api/recibo/escuta/export?format=markdown" />}>
          Exportar dados abertos (MD)
        </Button>
        <Button nativeButton={false} variant="default" render={<Link href="/escuta/bairro" />}>
          Participar da Escuta
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/quero-ajudar" />}>
          Quero ajudar na organização
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Período de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{receipt.periodStart} a {receipt.periodEnd}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pessoas Alcançadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{receipt.topics.uniquePeopleReached}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Relatos Diretos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{receipt.territorial?.totalReports ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Ações Criadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{receipt.actions.totalActions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>O que foi ouvido (Principais Temas)</CardTitle>
          </CardHeader>
          <CardContent>
            {receipt.topics.topics.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum tema destacado no período.</p>
            ) : (
              <ul className="space-y-3">
                {receipt.topics.topics.map((t, idx) => (
                  <li key={idx} className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">{t.name}</span>
                    <Badge variant="secondary">{t.interactionCount} interações</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>O que estamos fazendo (Ações)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-2xl font-bold text-slate-700">{receipt.actions.plannedActions}</p>
                <p className="text-xs text-muted-foreground">Planejadas</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-2xl font-bold text-blue-700">{receipt.actions.doingActions}</p>
                <p className="text-xs text-muted-foreground">Em andamento</p>
              </div>
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-2xl font-bold text-green-700">{receipt.actions.doneActions}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </div>
            {receipt.actions.totalActions === 0 ? (
              <p className="text-sm text-muted-foreground">As respostas estruturadas ainda estão em formulação.</p>
            ) : (
              <p className="text-sm">As ações corretivas respondem aos principais polos de silêncio e demandas reprimidas identificadas neste recibo.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="bg-slate-900 text-slate-50">
          <CardHeader>
            <CardTitle className="text-slate-100">Copiar legenda (Instagram/Facebook)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4 text-slate-300">Use com as imagens geradas (Cards 1:1 ou 3:4).</p>
            <div className="p-4 bg-slate-800 rounded-md border border-slate-700 font-mono text-sm break-words whitespace-pre-wrap">
              {shareLegend}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-slate-50">
          <CardHeader>
            <CardTitle className="text-slate-100">Copiar texto (WhatsApp)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4 text-slate-300">Copie o texto abaixo e compartilhe nos grupos para devolver o resultado da escuta à população de forma transparente.</p>
            <div className="p-4 bg-slate-800 rounded-md border border-slate-700 font-mono text-sm break-words whitespace-pre-wrap">
              {shareText}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-8 mb-4">
        Atualizado em: {new Date(receipt.lastUpdatedAt).toLocaleString("pt-BR")}. Recibo público agregado. Não contém dados pessoais, comentários brutos nem perfilamento individual.
      </p>

      {isInternal && (
        <DistributionPanel logs={distributionLogs} />
      )}
    </AppShell>
  );
}
