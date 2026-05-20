import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ClipboardList, Plus, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AcoesPage() {
  await requireInternalPageSession("/acoes");

  const plans = await listActionPlans();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "done": return "secondary"; // Note: 'success' variant doesn't typically exist in default shadcn badge, using secondary
      case "archived": return "outline";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Em andamento";
      case "done": return "Concluído";
      case "archived": return "Arquivado";
      case "draft": return "Rascunho";
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
      default: return priority;
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Plano de Ação por Pauta"
        description="Transforme relatórios de mobilização em ações concretas: posts, reuniões, plenárias e encaminhamentos."
      />

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-xs font-semibold flex items-center bg-charcoal/5 p-4 rounded-[2px] border-2 border-dashed border-cement text-charcoal">
          <AlertCircle className="h-4 w-4 mr-3 text-charcoal shrink-0" />
          <span>Planos organizam respostas públicas. Não use para segmentação individual ou perfilamento.</span>
        </div>
        <Button
          nativeButton={false}
          className="h-11 bg-burnt-yellow text-charcoal border-2 border-black rounded-[2px] px-6 text-xs font-black uppercase tracking-wider hover:bg-burnt-yellow/90 shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] transition-all shrink-0"
          render={<Link href="/acoes/novo" />}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Plano
        </Button>
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block bloco-concreto relative overflow-hidden py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-black hover:bg-transparent">
                <TableHead className="font-black text-charcoal">Título / Tema</TableHead>
                <TableHead className="font-black text-charcoal">Status</TableHead>
                <TableHead className="font-black text-charcoal">Prioridade</TableHead>
                <TableHead className="font-black text-charcoal">Itens</TableHead>
                <TableHead className="font-black text-charcoal">Prazo</TableHead>
                <TableHead className="text-right font-black text-charcoal">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} className="border-b border-cement/20 hover:bg-charcoal/5">
                  <TableCell>
                    <div className="flex flex-col">
                      <Link href={`/acoes/${plan.id}`} className="font-bold text-charcoal flex items-center hover:underline">
                        <ClipboardList className="mr-2 h-4 w-4 text-cement" />
                        {plan.title}
                      </Link>
                      <span className="text-xs font-semibold text-cement ml-6">
                        {plan.topic?.name || "Sem tema vinculado"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(plan.status)} className="rounded-[2px] border-2 border-black font-black uppercase tracking-wider text-[10px]">
                      {getStatusLabel(plan.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(plan.priority)} className="rounded-[2px] border-2 border-black font-black uppercase tracking-wider text-[10px]">
                      {getPriorityLabel(plan.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-charcoal">
                    {plan.itemCount} item(s)
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-cement">
                    {plan.due_date || "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-2 border-black bg-white text-charcoal hover:bg-burnt-yellow rounded-[2px]"
                      nativeButton={false}
                      render={<Link href={`/acoes/${plan.id}`} />}
                    >
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-cement font-semibold">
                    Nenhum plano de ação ativo.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile View: Card List Fallback */}
      <div className="grid gap-4 md:hidden">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bloco-concreto relative overflow-hidden p-5 bg-white space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/acoes/${plan.id}`} className="font-black text-charcoal text-base flex items-start hover:underline">
                  <ClipboardList className="mr-2 h-5 w-5 text-cement shrink-0 mt-0.5" />
                  {plan.title}
                </Link>
                <p className="text-xs font-semibold text-cement mt-1">
                  {plan.topic?.name || "Sem tema vinculado"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusVariant(plan.status)} className="rounded-[2px] border-2 border-black font-black uppercase tracking-wider text-[9px] px-2 py-0.5">
                {getStatusLabel(plan.status)}
              </Badge>
              <Badge variant={getPriorityColor(plan.priority)} className="rounded-[2px] border-2 border-black font-black uppercase tracking-wider text-[9px] px-2 py-0.5">
                {getPriorityLabel(plan.priority)}
              </Badge>
              <span className="text-xs font-bold text-charcoal self-center ml-auto">
                {plan.itemCount} item(s)
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-cement/20">
              <span className="text-xs font-semibold text-cement">
                Prazo: {plan.due_date || "N/A"}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-2 border-black bg-white text-charcoal hover:bg-burnt-yellow rounded-[2px]"
                nativeButton={false}
                render={<Link href={`/acoes/${plan.id}`} />}
              >
                Gerenciar
              </Button>
            </div>
          </div>
        ))}

        {plans.length === 0 ? (
          <div className="bloco-concreto p-8 text-center text-cement font-semibold bg-white">
            Nenhum plano de ação ativo.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
