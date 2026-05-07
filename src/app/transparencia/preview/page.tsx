import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function TransparenciaPreviewPage() {
  await requireInternalPageSession("/transparencia/preview");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Preview publico"
        title="Visualizacao segura da Transparencia Viva."
        description="Preview institucional para revisar linguagem e ausencia de dados sensiveis antes de qualquer publicacao."
        actions={<Button nativeButton={false} render={<Link href="/transparencia/homologacao" />}>Abrir homologacao</Button>}
      />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Transparencia publica ainda em desenvolvimento. A visualizacao deve permanecer agregada e sem dados brutos.
        </CardContent>
      </Card>
    </AppShell>
  );
}
