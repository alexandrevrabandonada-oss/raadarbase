import Link from "next/link";
import { ArrowLeft, CheckCircle2, Database, ShieldCheck } from "lucide-react";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listRadarConnectors, listRadarEntities } from "@/lib/radar-hub/data";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { SourceActions } from "./source-actions";

export const dynamic = "force-dynamic";
export default async function SourcesPage() {
  await requireInternalPageSession("/dashboard/inteligencia/fontes");
  const [connectors, hub] = await Promise.all([listRadarConnectors(), listRadarEntities({ pageSize: 10 })]);
  return <AppShell><PageHeader eyebrow="Governança de dados" title="Fontes e conectores" description="Somente dados públicos, oficiais, internos autorizados ou arquivos legitimamente possuídos." action={<Button variant="outline" nativeButton={false} render={<Link href="/dashboard/inteligencia" />}><ArrowLeft data-icon="inline-start" />Voltar</Button>} />
    <div className="flex flex-col gap-6 pb-12"><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{connectors.map((connector) => <Card key={connector.id}><CardHeader><CardTitle className="flex items-center justify-between gap-3"><span>{connector.display_name}</span><Badge variant={connector.enabled ? "default" : "secondary"}>{connector.enabled ? "Ativa" : "Configurável"}</Badge></CardTitle><CardDescription>{connector.mode === "file_import" ? "Arquivo fornecido legitimamente pelo usuário." : connector.mode === "internal" ? "Fonte interna já autorizada no Radar." : "Endpoint explícito, configurado e permitido."}</CardDescription></CardHeader><CardContent className="space-y-2 text-sm"><p className="flex items-center gap-2"><Database className="size-4" />{connector.source_type} · {hub.facets.sources[connector.source_type] ?? 0} registros</p><p className="flex items-center gap-2"><CheckCircle2 className="size-4" />Saúde: {connector.last_health_status}</p><p className="text-muted-foreground">Última sincronização: {connector.last_synced_at ? new Date(connector.last_synced_at).toLocaleString("pt-BR") : "ainda não executada"}</p></CardContent></Card>)}</section>
      <Card><CardHeader><CardTitle>Operações permitidas</CardTitle><CardDescription>Importação com normalização, deduplicação, evidência e auditoria.</CardDescription></CardHeader><CardContent><SourceActions /></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck />Limites éticos e legais</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">O Hub não burla autenticação, CAPTCHA ou mecanismos de segurança; não acessa páginas privadas; não coleta dados sensíveis; e não executa crawling genérico. Provedores HTTP só operam sobre endpoints HTTPS explicitamente autorizados.</CardContent></Card>
    </div></AppShell>;
}
