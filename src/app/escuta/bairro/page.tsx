import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BairroListenForm } from "./bairro-listen-form";

export const dynamic = "force-dynamic";

const ALLOWED_TOPIC_PRESETS = new Set(["saude", "transporte", "poluicao", "csn"]);

export default async function EscutaBairroPage({
  searchParams,
}: {
  searchParams?: Promise<{ reportId?: string; pauta?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const sourceReportId = params.reportId ?? null;
  const topicPreset = params.pauta && ALLOWED_TOPIC_PRESETS.has(params.pauta) ? params.pauta : null;

  return (
    <AppShell>
      <PageHeader
        title="Escuta territorial em 30 segundos"
        description="Conte bairro + pauta + relato curto. Sem dados pessoais. Contato opcional apenas com consentimento."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {sourceReportId ? (
          <Button nativeButton={false} variant="outline" render={<Link href={`/relatorios/${sourceReportId}/devolutiva`} />}>
            Voltar para devolutiva
          </Button>
        ) : null}
        <Button nativeButton={false} variant="outline" render={<Link href="/relatorios" />}>
          Ver relatórios
        </Button>
      </div>

      <Alert className="mb-6 border-slate-300/60 bg-slate-50/70">
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription>
          Escuta pública por pauta, sem perfilamento individual. Diga apenas bairro, pauta e relato curto. Não envie nome, telefone, e-mail, username ou dado sensível.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Formulário simples e rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <BairroListenForm sourceReportId={sourceReportId} topicPreset={topicPreset} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacidade e foco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Coletamos apenas bairro, pauta e relato curto para leitura coletiva.</p>
            <p>Contato só aparece se a pessoa marcar que quer retorno.</p>
            <p>Sem DM automática, sem resposta automática e sem criação automática de contato.</p>
            <p>Sem score político individual e sem microtargeting.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}