import AppShell from "@/components/app-shell";
import { DashboardChart } from "@/components/dashboard-chart";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { interactionsByDay } from "@/lib/mock-data";
import { listPeople } from "@/lib/data/people";
import { listPosts } from "@/lib/data/posts";
import { isMetaConfigured } from "@/lib/meta/client";
import { getMetaDashboardStats } from "@/lib/meta/sync";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Play, Lightbulb } from "lucide-react";
import { getStrategicMemoryStats } from "@/lib/data/strategic-memory";
import { getWebhookStatsAction } from "./actions";
import { Webhook } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireInternalPageSession("/dashboard");

  let posts;
  let memoryStats;
  let webhookStats;
  try {
    [, posts, memoryStats, webhookStats] = await Promise.all([
      listPeople(), 
      listPosts(),
      getStrategicMemoryStats().catch(() => ({ activeCount: 0, draftCount: 0, totalCount: 0 })),
      getWebhookStatsAction().catch(() => ({
        counts: { received: 0, verified: 0, quarantined: 0, ignored: 0, processed: 0, failed: 0 },
        staleCount: 0,
        invalidSignatureCount: 0,
        webhookEnabled: false,
        webhookConfigured: false,
      })),
    ]);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Dashboard" description="Painel interno de acompanhamento." />
        <RuntimeAlert
          title="Falha ao carregar dados"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar o dashboard."}
        />
      </AppShell>
    );
  }
  const totalInteractions = posts.reduce((sum, post) => sum + (post.interactions ?? 0), 0);
  const metaStats = await getMetaDashboardStats().catch(() => null);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Leitura rápida das interações da página, demandas que estão chegando e contatos com consentimento registrado."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-blue-500/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tema em Destaque (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">Transporte</p>
            <p className="text-xs text-muted-foreground mt-1">+12% de interações</p>
          </CardContent>
        </Card>
        <Card className="border-black/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Mobilização Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{totalInteractions.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground mt-1">Sinais de escuta captados</p>
          </CardContent>
        </Card>
        <Card className="border-black/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Temas para Revisão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black">14</p>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/temas/revisao" />}>Revisar</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase">Relatórios de Pauta</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="w-full" nativeButton={false} render={<Link href="/relatorios/novo" />}>
              Criar Relatório
            </Button>
          </CardContent>
        </Card>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isMetaConfigured() ? (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Última sincronização Meta</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-black">{metaStats?.latest?.status ?? "Sem registro"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Posts sincronizados</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-black">{metaStats?.posts ?? 0}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Comentários sincronizados</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-black">{metaStats?.comments ?? 0}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pessoas novas encontradas</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-black">{metaStats?.people ?? 0}</p></CardContent>
            </Card>
            <Card className={webhookStats?.webhookEnabled ? "border-green-200 bg-green-50/10" : "border-gray-200"}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Webhooks Meta</CardTitle>
                <Webhook className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black">{webhookStats?.counts.quarantined ?? 0}</p>
                    <p className="text-xs text-muted-foreground">em quarentena</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{webhookStats?.counts.processed ?? 0}</p>
                    <p className="text-xs text-muted-foreground">processados hoje</p>
                  </div>
                </div>
                {webhookStats?.counts.failed > 0 && (
                  <p className="text-xs text-red-500 mt-2">{webhookStats.counts.failed} falha(s)</p>
                )}
                <Button variant="outline" size="sm" className="w-full mt-3" nativeButton={false} render={<Link href="/integracoes/meta/webhooks" />}>
                  Ver Webhooks
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="sm:col-span-2 xl:col-span-4">
            <CardContent className="pt-6 text-sm font-medium text-muted-foreground">
              Integração Meta ainda não configurada.
            </CardContent>
          </Card>
        )}
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Pautas Mobilizadas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="text-xs text-muted-foreground mb-2">
                Assuntos públicos detectados através da escuta nas redes.
              </div>
              {[
                { name: "Transporte", count: 42, color: "#f59e0b" },
                { name: "Saúde", count: 38, color: "#ef4444" },
                { name: "Educação", count: 25, color: "#3b82f6" },
                { name: "CSN / Poluição", count: 19, color: "#4b5563" },
              ].map((topic) => (
                <div key={topic.name} className="flex items-center justify-between rounded-md border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: topic.color }} />
                    <span className="text-sm font-semibold">{topic.name}</span>
                  </div>
                  <Badge variant="outline">{topic.count} pautas</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Próximas Ações</CardTitle>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/acoes" />}>Ver todas</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-semibold">Post Público: Demandas Vila Rica</p>
                    <p className="text-xs text-muted-foreground">Tema: Saúde • Pendente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-sm font-semibold">Plenária Regional: Transporte</p>
                    <p className="text-xs text-muted-foreground">Tema: Mobilidade • Agendado</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" nativeButton={false} render={<Link href="/acoes/novo" />}>
                  Novo Plano de Ação
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Execução da Semana</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Feitas</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-2xl font-bold text-amber-600">3</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Vencidas</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Com evidência</span>
                  <span className="font-bold text-blue-600">85%</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[85%]" />
                </div>
              </div>
              <Link
                href="/execucao"
                className={buttonVariants({ variant: "outline", size: "sm", className: "w-full mt-4" })}
              >
                Ver Execução Detalhada
              </Link>
            </CardContent>
          </Card>

          <Card className="border-indigo-500/20 bg-indigo-50/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-indigo-900">Memória da Organização</CardTitle>
              <Lightbulb className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-black text-indigo-900">{memoryStats.activeCount}</p>
                <p className="text-[10px] text-indigo-700 uppercase font-bold">Aprendizados Ativos</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase">
                <div className="rounded bg-indigo-100 p-2 text-indigo-700">
                  {memoryStats.draftCount} Rascunhos
                </div>
                <div className="rounded bg-slate-100 p-2 text-slate-600 text-center">
                  Consolidado
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                nativeButton={false}
                render={<Link href="/memoria" />}
              >
                Acessar Memória Estratégica
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interações por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={interactionsByDay} />
          </CardContent>
        </Card>
      </section>
      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Posts mais ativos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {posts.slice(0, 4).map((post, index) => (
              <div key={post.id} className="rounded-md border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold line-clamp-1">#{index + 1} {post.caption}</p>
                    <p className="text-sm text-muted-foreground">{post.comments} comentários</p>
                  </div>
                  <Badge variant="secondary">{post.topic}</Badge>
                </div>
                <p className="mt-2 text-2xl font-black">{post.interactions}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
