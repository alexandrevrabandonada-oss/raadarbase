import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listSquads } from "@/lib/data/volunteers";
import { createSquadAction } from "@/app/voluntarios/actions";

export const dynamic = "force-dynamic";

export default async function VolunteerSquadsPage() {
  await requireInternalPageSession("/voluntarios/squads");
  const squads = await listSquads();

  return (
    <AppShell>
      <PageHeader title="Squads" description="Organize times internos de campanha e acompanhe vínculos com ações de campo, sem contato automático." />

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Squads ativas</CardTitle></CardHeader>
          <CardContent>
            {squads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma squad cadastrada ainda.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Membros</TableHead><TableHead>Ações ligadas</TableHead></TableRow></TableHeader>
                <TableBody>
                  {squads.map((squad) => (
                    <TableRow key={squad.id}>
                      <TableCell><Link href={`/voluntarios/squads/${squad.id}`} className="font-semibold underline">{squad.name}</Link></TableCell>
                      <TableCell>{squad.kind}</TableCell>
                      <TableCell>{squad.memberCount}</TableCell>
                      <TableCell>{squad.fieldActionCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Criar squad</CardTitle></CardHeader>
          <CardContent>
            <form action={createSquadAction} className="space-y-3">
              <Input name="name" placeholder="Nome da squad" required />
              <Input name="description" placeholder="Descrição curta" />
              <select name="kind" className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" defaultValue="rua">
                <option value="rua">Rua</option>
                <option value="comunicacao">Comunicação</option>
                <option value="dados">Dados</option>
                <option value="formacao">Formação</option>
                <option value="eventos">Eventos</option>
                <option value="territorio">Território</option>
                <option value="outro">Outro</option>
              </select>
              <Button type="submit">Criar squad</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}