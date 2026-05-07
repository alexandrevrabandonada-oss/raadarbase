import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/authz/roles";
import { getVolunteer } from "@/lib/data/volunteers";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { updateVolunteerAction } from "@/app/voluntarios/actions";
import { VolunteerForm } from "@/app/voluntarios/volunteer-form";

export const dynamic = "force-dynamic";

export default async function EditVolunteerPage({ params, searchParams }: { params: { id: string }; searchParams?: Promise<{ error?: string }> }) {
  await requireInternalPageSession(`/voluntarios/${params.id}/editar`);
  await requireRole(["admin", "operador", "comunicacao"]);
  const resolvedSearchParams = await searchParams;

  const detail = await getVolunteer(params.id, { includeContact: true });
  if (!detail) notFound();

  return (
    <AppShell>
      <PageHeader title="Editar voluntário" description={`Ajuste os dados consentidos de ${detail.volunteer.displayName}.`} />
      <Card>
        <CardHeader>
          <CardTitle>Dados do voluntário</CardTitle>
        </CardHeader>
        <CardContent>
          <VolunteerForm
            action={updateVolunteerAction.bind(null, params.id)}
            submitLabel="Salvar alterações"
            cancelHref={`/voluntarios/${params.id}`}
            defaults={detail.volunteer}
            error={resolvedSearchParams?.error}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}