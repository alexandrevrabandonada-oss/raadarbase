import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listActionPlans } from "@/lib/data/action-plans";
import { getNeighborhoodListenSummary } from "@/lib/data/neighborhood-listening";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { PosBancaMobileGuide } from "./pos-banca-mobile-guide";

export const dynamic = "force-dynamic";

export default async function PosBancaPage() {
  await requireInternalPageSession("/pos-banca");
  const [plans, summary] = await Promise.all([
    listActionPlans().catch(() => []),
    getNeighborhoodListenSummary().catch(() => null),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Pos-banca"
        title="Leitura guiada para homologacao e fechamento."
        description="No celular, esta area prioriza sequencia de decisao e evita tabelas largas."
        actions={<Button nativeButton={false} render={<Link href="/relatorios" />}>Ver relatorios</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <PosBancaMobileGuide
          actions={(plans.length ? plans : [{ id: "fallback", title: "Sem acao selecionada", topic: "Sem tema", status: "aberto" }]).map((plan) => ({
            id: plan.id,
            title: plan.title,
            topic: typeof plan.topic === "string" ? plan.topic : plan.topic?.name || "Sem tema",
            status: plan.status,
          }))}
        />

        <div className="space-y-4">
          <Card className="rounded-2xl border-[#e2d7c4]">
            <CardHeader><CardTitle>Pendencias</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Dossies abertos: {plans.filter((plan) => plan.status !== "done").length}</p>
              <p>Escutas para revisar: {summary?.statusCounts.find((item) => item.status === "novo")?.quantidade ?? 0}</p>
              <p>Devolutivas pendentes: {summary?.totalReports ?? 0} relatos ainda dependem de leitura coletiva final.</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#e2d7c4]">
            <CardHeader><CardTitle>Territorios de referencia</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {(summary?.topBairros.slice(0, 5) ?? []).map((item) => (
                <div key={item.bairro} className="flex items-center justify-between rounded-xl border border-[#eee4d4] px-3 py-3">
                  <span>{item.bairro}</span>
                  <span className="font-bold text-foreground">{item.quantidade}</span>
                </div>
              ))}
              {!summary?.topBairros.length ? <p>Sem territorios suficientes para resumo agora.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
