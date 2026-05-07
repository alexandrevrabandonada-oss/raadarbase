import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function TransparenciaHomologacaoPage() {
  await requireInternalPageSession("/transparencia/homologacao");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Homologacao"
        title="Checklist institucional de publicacao."
        description="Confirme agregacao, seguranca e linguagem publica antes de liberar qualquer snapshot."
        actions={<Button variant="outline" nativeButton={false} render={<Link href="/transparencia/snapshots" />}>Ver snapshots</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {["Sem PII", "Sem payload bruto", "Aprovacao humana", "Snapshot agregado"].map((item) => (
          <Card key={item}>
            <CardHeader><CardTitle>{item}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Item de conferencia visual. As regras existentes continuam preservadas.</CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
