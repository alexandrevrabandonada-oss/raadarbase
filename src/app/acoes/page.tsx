import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listActionPlans } from "@/lib/data/action-plans";

export const dynamic = "force-dynamic";

function priorityLabel(priority: string) {
  if (priority === "high") return "Alta";
  if (priority === "low") return "Baixa";
  return "Media";
}

function statusLabel(status: string) {
  if (status === "done") return "Fechado";
  if (status === "archived") return "Arquivado";
  if (status === "draft") return "Rascunho";
  return "Aberto";
}

export default async function AcoesPage() {
  await requireInternalPageSession("/acoes");
  const plans = await listActionPlans();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Acoes"
        title="Fila de acoes e dossies para operar no campo."
        description="No celular, as acoes viram cards com atalhos para abrir, digitar fichas e revisar."
        actions={
          <Button nativeButton={false} render={<Link href="/acoes/novo" />}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nova acao
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#dcc9aa] bg-[#fff7e9] p-4 text-sm text-[#5c6254] md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-[#0b5a3f]" />
          <p>Planos organizam respostas coletivas. Nao use esta fila para segmentacao individual ou perfilamento.</p>
        </div>
        <Button nativeButton={false} variant="outline" render={<Link href="/escutas/lote" />} className="h-11 rounded-xl">
          Digitar fichas
        </Button>
      </div>

      <div className="grid gap-4 lg:hidden">
        {plans.length ? (
          plans.map((plan) => (
            <Card key={plan.id} className="rounded-2xl border-[#e2d7c4]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6d3a]">Acao</p>
                    <h2 className="mt-1 text-lg font-black text-[#0b3326]">{plan.title}</h2>
                    <p className="mt-1 text-sm text-[#607169]">{plan.topic?.name || "Sem territorio definido"}</p>
                  </div>
                  <Badge variant="outline">{statusLabel(plan.status)}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniInfo label="Data" value={plan.due_date || "Sem prazo"} />
                  <MiniInfo label="Prioridade" value={priorityLabel(plan.priority)} />
                  <MiniInfo label="Total de escutas" value={String(plan.itemCount)} />
                  <MiniInfo label="Dossie" value={plan.status === "done" ? "Fechado" : "Aberto"} />
                  <MiniInfo label="Devolutiva" value={plan.status === "done" ? "Aprovada" : "Pendente"} />
                  <MiniInfo label="Territorio" value={plan.topic?.name || "Sem tema"} />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button variant="outline" nativeButton={false} render={<Link href={`/acoes/${plan.id}`} />} className="h-11 rounded-xl">
                    Abrir
                  </Button>
                  <Button variant="outline" nativeButton={false} render={<Link href="/escutas/lote" />} className="h-11 rounded-xl">
                    Digitar fichas
                  </Button>
                  <Button nativeButton={false} render={<Link href="/escutas" />} className="h-11 rounded-xl bg-[#073d2b] hover:bg-[#0b4d37]">
                    Revisar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="rounded-2xl border-dashed border-[#d9ccb8]">
            <CardContent className="p-8 text-center">
              <p className="text-lg font-black text-[#0b3326]">Nenhuma acao ativa.</p>
              <p className="mt-2 text-sm text-[#62736b]">Crie um plano para organizar devolutiva, revisao e operacao em campo.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo / tema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link href={`/acoes/${plan.id}`} className="font-semibold hover:underline">
                        {plan.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">{plan.topic?.name || "Sem tema vinculado"}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{statusLabel(plan.status)}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{priorityLabel(plan.priority)}</Badge></TableCell>
                  <TableCell className="text-xs font-medium">{plan.itemCount} item(s)</TableCell>
                  <TableCell className="text-xs">{plan.due_date || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/acoes/${plan.id}`} />}>
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Nenhum plano de acao ativo.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d4] bg-[#fffdf9] px-3 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a6d3a]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#173a2d]">{value}</p>
    </div>
  );
}
