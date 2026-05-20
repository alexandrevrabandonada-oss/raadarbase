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
import { cn } from "@/lib/utils";

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
          <div className="flex flex-wrap gap-2">
            <Button nativeButton={false} variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider" render={<Link href="/api/voluntarios/inscricoes/export" />}>
              Exportar seguro
            </Button>
            <Button nativeButton={false} variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider" render={<Link href="/voluntarios/inscricoes/retencao" />}>
              Retenção
            </Button>
            {canExportContacts ? (
              <Button nativeButton={false} variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider" render={<Link href="/api/voluntarios/inscricoes/export?include_contact=true" />}>
                Exportar com contato
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-6">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status} className="bloco-concreto bg-white">
            <CardHeader className="pb-3 border-b-2 border-black">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-cement">{status}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-black text-charcoal pt-4">{count}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="bloco-concreto bg-white mt-6">
        <CardHeader className="pb-3 border-b-2 border-black">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-charcoal">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-5">
            <Input name="status" placeholder="pending, approved..." className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={params?.status ?? ""} />
            <Input name="neighborhood" placeholder="Bairro" className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={params?.neighborhood ?? ""} />
            <Input name="skill" placeholder="Habilidade" className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={params?.skill ?? ""} />
            <Input name="interest" placeholder="Interesse" className="bg-charcoal/5 border-2 border-black rounded-[2px] text-charcoal font-semibold" defaultValue={params?.interest ?? ""} />
            <div className="flex gap-2">
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 rounded-[2px] border-2 border-black font-black uppercase text-xs tracking-wider">Filtrar</Button>
              <Button nativeButton={false} variant="outline" className="border-2 border-black bg-white font-black text-charcoal rounded-[2px] hover:bg-charcoal/5 text-xs uppercase tracking-wider" render={<Link href="/voluntarios/inscricoes" />}>Limpar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bloco-concreto bg-white mt-6 overflow-hidden">
        <CardHeader className="pb-3 border-b-2 border-black">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-charcoal">Fila</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {applications.length === 0 ? (
            <p className="text-sm text-cement p-6 font-semibold">Nenhuma inscrição encontrada. Banco vazio não quebra a fila.</p>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {applications.map((application) => (
                  <Link key={application.id} href={`/voluntarios/inscricoes/${application.id}`} className="block">
                    <Card className="bloco-concreto bg-white">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-black text-charcoal">{application.displayName}</p>
                            <p className="truncate text-xs text-cement font-semibold">{application.neighborhood ?? "Sem bairro"}</p>
                          </div>
                          <Badge
                            className={cn(
                              "shrink-0 rounded-[2px] border-2 border-black font-black text-[9px] uppercase tracking-widest",
                              application.status === "approved"
                                ? "bg-moss/10 text-moss"
                                : application.status === "pending"
                                  ? "bg-burnt-yellow/10 text-charcoal"
                                  : "bg-charcoal/10 text-charcoal",
                            )}
                          >
                            {application.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-cement">
                          <span>{application.skills.slice(0, 3).join(", ") || "Sem habilidade"}</span>
                          <span>{application.interests.slice(0, 3).join(", ") || "Sem interesse"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-black/10">
                          <span className="text-cement font-semibold">{application.hasContact ? "Contato seguro" : "Sem contato"}</span>
                          <span className="font-black text-charcoal font-semibold">Revisar →</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-charcoal/5 border-b-2 border-black">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Nome</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Bairro</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Habilidades</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Interesses</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Status</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-charcoal">Contato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id} className="group hover:bg-charcoal/5 border-b border-black/10 transition-colors">
                        <TableCell>
                          <Link className="font-black text-charcoal hover:underline" href={`/voluntarios/inscricoes/${application.id}`}>
                            {application.displayName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-charcoal">{application.neighborhood ?? "-"}</TableCell>
                        <TableCell className="text-[10px] font-bold text-cement uppercase tracking-tighter">{application.skills.join(", ") || "-"}</TableCell>
                        <TableCell className="text-[10px] font-bold text-cement uppercase tracking-tighter">{application.interests.join(", ") || "-"}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "font-black text-[9px] uppercase tracking-widest rounded-[2px] border-2 border-black",
                            application.status === 'approved' ? 'bg-moss/10 text-moss' : 
                            application.status === 'pending' ? 'bg-burnt-yellow/10 text-charcoal' : 'bg-charcoal/10 text-charcoal'
                          )}>
                            {application.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-cement">{application.hasContact ? "Oculto na lista" : "Sem contato"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
