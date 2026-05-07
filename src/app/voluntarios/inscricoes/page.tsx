import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageContacts } from "@/lib/authz/roles";
import { listVolunteerApplications, type VolunteerApplicationStatus } from "@/lib/data/volunteer-applications";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function parseStatus(value: string | undefined): VolunteerApplicationStatus | undefined {
  return value && ["pending", "approved", "rejected", "archived"].includes(value) ? (value as VolunteerApplicationStatus) : undefined;
}

export default async function VolunteerApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; neighborhood?: string; skill?: string; interest?: string }>;
}) {
  const session = await requireInternalPageSession("/voluntarios/inscricoes");
  const params = await searchParams;
  const applications = await listVolunteerApplications({
    status: parseStatus(params?.status),
    neighborhood: params?.neighborhood,
    skill: params?.skill,
    interest: params?.interest,
  });
  const counts = {
    pending: applications.filter((item) => item.status === "pending").length,
    approved: applications.filter((item) => item.status === "approved").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
    archived: applications.filter((item) => item.status === "archived").length,
  };
  const canExportContacts = canManageContacts(session.internalUser.role);

  return (
    <AppShell>
      <PageHeader
        title="Inscrições de voluntariado"
        description="Fila de revisão humana para inscrições públicas consentidas. Nada vira voluntário ativo automaticamente."
        action={
          <div className="flex gap-2">
            <Button nativeButton={false} variant="outline" render={<Link href="/api/voluntarios/inscricoes/export" />}>
              Exportar seguro
            </Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/inscricoes/retencao" />}>
              Retenção
            </Button>
            {canExportContacts ? (
              <Button nativeButton={false} variant="outline" render={<Link href="/api/voluntarios/inscricoes/export?include_contact=true" />}>
                Exportar com contato
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status}>
            <CardHeader><CardTitle>{status}</CardTitle></CardHeader>
            <CardContent className="text-3xl font-black">{count}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-5">
            <Input name="status" placeholder="pending, approved..." defaultValue={params?.status ?? ""} />
            <Input name="neighborhood" placeholder="Bairro" defaultValue={params?.neighborhood ?? ""} />
            <Input name="skill" placeholder="Habilidade" defaultValue={params?.skill ?? ""} />
            <Input name="interest" placeholder="Interesse" defaultValue={params?.interest ?? ""} />
            <div className="flex gap-2">
              <Button type="submit">Filtrar</Button>
              <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/inscricoes" />}>Limpar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Fila</CardTitle></CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma inscrição encontrada. Banco vazio não quebra a fila.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Habilidades</TableHead>
                  <TableHead>Interesses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell><Link className="font-semibold underline" href={`/voluntarios/inscricoes/${application.id}`}>{application.displayName}</Link></TableCell>
                    <TableCell>{application.neighborhood ?? "-"}</TableCell>
                    <TableCell>{application.skills.join(", ") || "-"}</TableCell>
                    <TableCell>{application.interests.join(", ") || "-"}</TableCell>
                    <TableCell><Badge variant="outline">{application.status}</Badge></TableCell>
                    <TableCell>{application.hasContact ? "Oculto na lista" : "Sem contato"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
