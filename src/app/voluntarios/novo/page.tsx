import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/authz/roles";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { createVolunteerAction } from "@/app/voluntarios/actions";
import { VolunteerForm } from "@/app/voluntarios/volunteer-form";

export const dynamic = "force-dynamic";

export default async function NewVolunteerPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  await requireInternalPageSession("/voluntarios/novo");
  await requireRole(["admin", "operador", "comunicacao"]);
  const resolvedSearchParams = await searchParams;

  return (
    <AppShell>
      <PageHeader
        title="Novo voluntário"
        description="Cadastre apenas pessoas que consentiram explicitamente com armazenamento de dados e, se houver contato, também com contato opcional."
      />

      <Card>
        <CardHeader>
          <CardTitle>Cadastro interno consentido</CardTitle>
        </CardHeader>
        <CardContent>
          <VolunteerForm action={createVolunteerAction} submitLabel="Salvar voluntário" cancelHref="/voluntarios" error={resolvedSearchParams?.error} />
        </CardContent>
      </Card>
    </AppShell>
  );
}