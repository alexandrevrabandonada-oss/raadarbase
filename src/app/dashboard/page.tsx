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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireInternalPageSession("/dashboard");

  let people;
  let posts;
  let metaStats = null;
  try {
    [people, posts, metaStats] = await Promise.all([listPeople(), listPosts(), getMetaDashboardStats().catch(() => null)]);
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
  const newPeople = people.filter((person) => person.status === "novo").length;
  const toReply = people.filter((person) => person.status === "responder").length;
  const confirmed = people.filter((person) => person.status === "contato_confirmado").length;
  const topPost = posts[0];

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Leitura rápida das interações da página, demandas que estão chegando e contatos com consentimento registrado."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total de interações", totalInteractions.toLocaleString("pt-BR")],
          ["Novos perfis", newPeople],
          ["Pessoas para responder", toReply],
          ["Contatos confirmados", confirmed],
          ["Post mais mobilizou", topPost?.mobilizationScore ?? 0],
        ].map(([label, value]) => (
          <Card key={label} className="border-black/10 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{value}</p>
            </CardContent>
          </Card>
        ))}
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
          </>
        ) : (
          <Card className="sm:col-span-2 xl:col-span-4">
            <CardContent className="pt-6 text-sm font-medium text-muted-foreground">
              Integração Meta ainda não configurada.
            </CardContent>
          </Card>
        )}
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Interações por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={interactionsByDay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Posts mais ativos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {posts.map((post, index) => (
              <div key={post.id} className="rounded-md border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">#{index + 1} {post.caption}</p>
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
