import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPublicListeningReceipt } from "@/lib/data/public-listening-receipt";
import { getInternalSession } from "@/lib/supabase/auth";
import { DistributionPanel } from "./distribution-panel";
import { listReceiptDistributionLogs } from "@/lib/data/public-receipt-distribution";
import { CopyShareCard } from "./copy-share-card";

export const dynamic = "force-dynamic";

export default async function PublicListeningReceiptPage() {
  const receipt = await getPublicListeningReceipt();

  const session = await getInternalSession();
  const isInternal = !!session && ["admin", "operador"].includes(session.internalUser.role);
  const distributionLogs = isInternal ? await listReceiptDistributionLogs() : [];

  const shareText = `O projeto Radar de Base publicou o Recibo de Escuta! Entre ${receipt.periodStart} e ${receipt.periodEnd}, ouvimos a população e convertemos isso em ações reais. Foram ${receipt.actions.totalActions} ações corretivas criadas a partir das demandas. Veja o que está sendo feito, de forma transparente e segura: [Link]\nParticipe você também: [Link do formulário]`;
  const shareLegend = `Aqui prestamos contas! 📢\nEstes são dados agregados da nossa escuta pública entre ${receipt.periodStart} e ${receipt.periodEnd}. Já criamos ${receipt.actions.totalActions} ações corretivas reais. Veja o que ouvimos e o que está sendo feito, sempre com total segurança aos seus dados.\n👉 Participe você também pelo nosso formulário online (link na bio/stories)!\n\n#EscutaAtiva #RadarDeBase #MissaoELuta #PrestacaoDeContas #ParticipacaoPublica`;

  const pageContent = (
    <div className="space-y-6">
      {/* Aviso Brutalista de Privacidade */}
      <Alert className="border-2 border-black bg-[#FFF7CD] text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
        <AlertTitle className="font-black uppercase tracking-wider text-xs">Transparência & Privacidade</AlertTitle>
        <AlertDescription className="text-xs mt-1">
          Este recibo mostra dados agregados de escuta pública. Não identifica pessoas, não exibe comentários brutos e não usa perfilamento individual.
        </AlertDescription>
      </Alert>

      {/* Ações e Downloads */}
      <div className="flex gap-3 flex-wrap">
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

      {/* Grid de Métricas Brutalistas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bloco-concreto">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-wider text-cement">Período de Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-black text-charcoal">{receipt.periodStart} a {receipt.periodEnd}</p>
          </CardContent>
        </Card>
        <Card className="bloco-concreto">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-wider text-cement">Pessoas Alcançadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-charcoal">{receipt.topics.uniquePeopleReached}</p>
          </CardContent>
        </Card>
        <Card className="bloco-concreto">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-wider text-cement">Relatos Diretos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-charcoal">{receipt.territorial?.totalReports ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bloco-concreto">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-wider text-cement">Ações Criadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-charcoal">{receipt.actions.totalActions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Painéis Centrais */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bloco-concreto">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-charcoal">O que foi ouvido (Principais Temas)</CardTitle>
          </CardHeader>
          <CardContent>
            {receipt.topics.topics.length === 0 ? (
              <p className="text-xs text-cement italic">Nenhum tema destacado no período.</p>
            ) : (
              <ul className="space-y-2">
                {receipt.topics.topics.map((t, idx) => (
                  <li key={idx} className="flex justify-between items-center border-b border-cement/20 pb-2">
                    <span className="font-bold text-xs text-charcoal">{t.name}</span>
                    <Badge variant="outline" className="border-black font-mono text-[10px]">
                      {t.interactionCount} interações
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="bloco-concreto">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-charcoal">O que estamos fazendo (Ações)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="p-3 border-2 border-black bg-zinc-50 dark:bg-zinc-800 rounded-[2px]">
                <p className="text-xl font-black text-charcoal dark:text-off-white">{receipt.actions.plannedActions}</p>
                <p className="text-[9px] font-black uppercase tracking-wider text-cement">Planejadas</p>
              </div>
              <div className="p-3 border-2 border-black bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 rounded-[2px]">
                <p className="text-xl font-black text-amber-700 dark:text-burnt-yellow">{receipt.actions.doingActions}</p>
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">Em curso</p>
              </div>
              <div className="p-3 border-2 border-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 rounded-[2px]">
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{receipt.actions.doneActions}</p>
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Concluídas</p>
              </div>
            </div>
            {receipt.actions.totalActions === 0 ? (
              <p className="text-xs text-cement italic">As respostas estruturadas ainda estão em formulação.</p>
            ) : (
              <p className="text-xs text-cement">
                As ações corretivas respondem aos principais polos de silêncio e demandas territoriais coletadas no período.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Copiadores de Legenda/Texto Interativos */}
      <div className="grid gap-6 md:grid-cols-2">
        <CopyShareCard
          title="Copiar legenda (Instagram/Facebook)"
          description="Use com as imagens geradas (Cards 1:1 ou 3:4)."
          text={shareLegend}
          buttonLabel="Copiar Legenda"
        />

        <CopyShareCard
          title="Copiar texto (WhatsApp)"
          description="Compartilhe nos grupos para devolver o resultado da escuta à população de forma transparente."
          text={shareText}
          buttonLabel="Copiar Texto"
        />
      </div>
      
      <p className="text-[10px] text-center text-cement mt-8">
        Atualizado em: {new Date(receipt.lastUpdatedAt).toLocaleString("pt-BR")}. Recibo público agregado.
      </p>
    </div>
  );

  if (isInternal) {
    return (
      <AppShell>
        <PageHeader
          title="Recibo Público da Escuta"
          description="A prestação de contas transparente do Radar de Base. Veja o que foi ouvido e o que estamos fazendo."
        />
        
        {pageContent}

        <DistributionPanel logs={distributionLogs} />
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-cement">Radar de Base</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-charcoal">Recibo Público da Escuta</h1>
          <p className="mt-3 text-cement text-sm">
            A prestação de contas transparente da pré-campanha de Volta Redonda. Veja o que foi ouvido e o que estamos fazendo.
          </p>
        </div>

        {pageContent}
      </div>
    </main>
  );
}
