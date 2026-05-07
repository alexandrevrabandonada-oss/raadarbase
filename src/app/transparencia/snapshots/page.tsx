import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function TransparenciaSnapshotsPage() {
  await requireInternalPageSession("/transparencia/snapshots");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Transparencia Viva"
        title="Snapshots aprovados para publicacao."
        description="Area interna para acompanhar pacotes agregados, sem dados brutos ou informacoes sensiveis."
        actions={<Button nativeButton={false} render={<Link href="/transparencia/preview" />}>Abrir preview</Button>}
      />
      <Card>
        <CardHeader><CardTitle>Nenhum snapshot publicado neste recorte</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Quando houver snapshot aprovado, ele aparece aqui com status e trilha de homologacao.</CardContent>
      </Card>
    </AppShell>
  );
}
