import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInternalSession, requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  await requireInternalPageSession("/equipe");
  const session = await getInternalSession();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Equipe"
        title="Equipe operacional."
        description="Identificacao da sessao interna e orientacoes de uso seguro."
      />
      <Card>
        <CardHeader><CardTitle>Sessao atual</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Usuario:</strong> {session?.email ?? "Nao identificado"}</p>
          <p>Permissoes continuam sendo aplicadas pelas regras existentes de profiles, RLS e actions server-side.</p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
