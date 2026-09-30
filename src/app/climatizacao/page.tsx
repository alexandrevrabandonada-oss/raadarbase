import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listClimateOpsSummary, type ClimateProtocol } from "@/lib/climatizacao/data";
import { ClimateCopyButton } from "./copy-button";
import { ClimateProtocolActions } from "./protocol-actions";
import { ChangeOrgIntegrationForm } from "./change-org-form";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function deadlineLabel(protocol: ClimateProtocol) {
  if (protocol.status === "draft") return { text: "Ainda não protocolado", className: "text-muted-foreground" };
  if (protocol.status === "answered" || protocol.status === "closed") return { text: "Respondido", className: "text-emerald-700" };
  if (!protocol.due_at) return { text: "Prazo não informado", className: "text-muted-foreground" };

  const diffDays = Math.ceil((new Date(protocol.due_at).getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return { text: `Atrasado há ${Math.abs(diffDays)} dia(s)`, className: "text-red-700" };
  if (diffDays === 0) return { text: "Prazo estimado vence hoje", className: "text-amber-700" };
  return { text: `Prazo estimado: ${diffDays} dia(s)`, className: diffDays <= 3 ? "text-amber-700" : "text-muted-foreground" };
}

function statusVariant(status: string) {
  if (status === "answered" || status === "closed") return "secondary";
  if (status === "overdue") return "destructive";
  return "outline";
}

export default async function ClimatizacaoOpsPage() {
  await requireInternalPageSession("/climatizacao");
  const data = await listClimateOpsSummary();

  const openProtocols = data.protocols.filter((item) => item.status === "submitted").length;
  const changeOrg = data.integrations.find((item) => item.provider === "change_org");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Climatização nas escolas"
        title="Central de cobrança"
        description="Relatos, abaixo-assinado e pedidos de informação em um único fluxo operacional."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Button nativeButton={false} render={<a href="https://www.alexandrevrabandonada.online/climatizacao" target="_blank" rel="noreferrer" />}>
          Abrir painel público
        </Button>
        <Button variant="outline" nativeButton={false} render={<a href="https://falabr.cgu.gov.br/web/login" target="_blank" rel="noreferrer" />}>
          Abrir Fala.BR
        </Button>
        <Button variant="outline" nativeButton={false} render={<a href="https://www.change.org/start-a-petition" target="_blank" rel="noreferrer" />}>
          Criar petição no Change.org
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card><CardHeader><CardTitle>Apoios totais</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{data.totalSupports}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Apoios estudantis</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{data.studentSupports}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Assinaturas adultas</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{data.signatures}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Relatos</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{data.reports}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Pedidos aguardando</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{openProtocols}</p></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ponte com Change.org</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O nosso abaixo-assinado continua sendo a fonte principal, inclusive para menores. O Change.org funciona como canal complementar para quem pode usar a plataforma.
          </p>
          <ChangeOrgIntegrationForm integration={changeOrg} />
        </CardContent>
      </Card>

      <div className="space-y-5">
        {data.protocols.map((protocol) => {
          const deadline = deadlineLabel(protocol);
          return (
            <Card key={protocol.id}>
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{protocol.recipient}</p>
                    <CardTitle className="mt-1">{protocol.title}</CardTitle>
                  </div>
                  <Badge variant={statusVariant(protocol.status)}>{protocol.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span>Protocolo: <strong>{protocol.protocol_number ?? "—"}</strong></span>
                  <span>Enviado: <strong>{formatDate(protocol.submitted_at)}</strong></span>
                  <span>Prazo: <strong>{formatDate(protocol.due_at)}</strong></span>
                  <span className={deadline.className}><strong>{deadline.text}</strong></span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {protocol.legal_basis ? <p className="text-xs text-muted-foreground">{protocol.legal_basis}</p> : null}
                {protocol.request_text ? (
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold">Texto pronto para protocolo</p>
                      <ClimateCopyButton text={protocol.request_text} />
                    </div>
                    <textarea
                      readOnly
                      value={protocol.request_text}
                      className="min-h-64 w-full resize-y rounded-md border bg-background p-3 text-sm leading-6"
                    />
                  </div>
                ) : null}
                <ClimateProtocolActions protocol={protocol} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
