import Link from "next/link";
import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listTopicCategories } from "@/lib/data/topics";
import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { RadarMetricCard } from "@/components/radar/radar-metric-card";
import { ListChecks, Hash, ClipboardList, ShieldAlert, Flame, ArrowRight } from "lucide-react";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { LightweightOnboarding } from "@/components/radar/onboarding/lightweight-onboarding";
import { getPendingTopicReviews } from "@/lib/data/topics";
import { listTerritorySummaries } from "@/lib/data/territories";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";

export const dynamic = "force-dynamic";

export default async function TemasPage() {
  await requireInternalPageSession("/temas");

  const categories = await listTopicCategories();
  
  // Buscar contagens de interações por tema
  let countByTopic: Record<string, number> = {};
  let totalInteractions = 0;
  if (!shouldUseMockData()) {
    const supabase = getSupabaseAdminClient();
    const { data: counts } = await supabase
      .from("interaction_topic_tags")
      .select("topic_id");

    countByTopic = (counts ?? []).reduce((acc: Record<string, number>, curr) => {
      acc[curr.topic_id] = (acc[curr.topic_id] || 0) + 1;
      totalInteractions++;
      return acc;
    }, {});
  } else {
    // Mock counts
    categories.forEach((c, i) => {
      countByTopic[c.id] = (10 - i) * 5;
      totalInteractions += countByTopic[c.id];
    });
  }

  const pendingReviews = await getPendingTopicReviews(10);
  const featuredTopic = categories.sort((a, b) => (countByTopic[b.id] || 0) - (countByTopic[a.id] || 0))[0];
  const territories = await listTerritorySummaries();
  const fieldEvents = await listFieldAgendaEvents({ includeMetrics: true });

  const topicConnections = categories.map((category) => {
    const relatedTerritories = territories
      .filter((territory) => territory.topThemes.some((theme) => theme.theme.toLowerCase() === category.slug.toLowerCase() || theme.theme.toLowerCase() === category.name.toLowerCase()))
      .map((territory) => ({
        neighborhood: territory.neighborhood,
        phase: mapTerritoryToPhase(territory).label,
      }));

    const relatedFieldEvents = fieldEvents.filter((event) => event.topicSlug === category.slug);
    const continuityTerritories = relatedTerritories.filter((territory) =>
      territories.find((item) => item.neighborhood === territory.neighborhood) &&
      mapTerritoryToPhase(territories.find((item) => item.neighborhood === territory.neighborhood)!).id === "continuidade"
    );

    return {
      category,
      relatedTerritories,
      relatedFieldEvents,
      continuityTerritories,
    };
  });
  
  return (
    <AppShell>
      <LightweightOnboarding 
        screenId="temas"
        title="Mapa de Assuntos"
        highlights={[
          { title: "Onde começar", description: "Veja quais categorias possuem o maior volume de interações recentes.", icon: Hash },
          { title: "Ação principal", description: "Identifique pautas recorrentes que podem virar novos Planos de Ação.", icon: ClipboardList },
          { title: "Evite este erro", description: "O foco aqui é o conteúdo das mensagens, nunca os dados sensíveis dos cidadãos.", icon: ShieldAlert },
        ]}
      />
      <RadarPageHeader
        eyebrow="Mapa de Assuntos"
        title="Temas e Pautas"
        description="Assuntos públicos conectados ao mapa territorial, ao campo e à continuidade."
        actions={
          <Button nativeButton={false} className="bg-indigo-600 hover:bg-indigo-700 font-bold" render={<Link href="/temas/revisao" />}>
            <ListChecks className="mr-2 h-4 w-4" />
            Revisar tags pendentes
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <RadarMetricCard 
          label="Temas Ativos" 
          value={categories.length} 
          icon={Hash} 
          helper="Categorias monitoradas"
          tone="info"
        />
        <RadarMetricCard 
          label="Tags Pendentes" 
          value={pendingReviews.length >= 10 ? "10+" : pendingReviews.length} 
          icon={ClipboardList} 
          helper="Aguardando revisão"
          tone={pendingReviews.length > 0 ? "warning" : "success"}
          href="/temas/revisao"
        />
        <RadarMetricCard 
          label="Interações Totais" 
          value={totalInteractions} 
          icon={ListChecks} 
          helper="Mapeadas pela equipe"
          tone="neutral"
        />
        <RadarMetricCard 
          label="Destaque" 
          value={featuredTopic?.name.split(" ")[0] || "-"} 
          icon={Flame} 
          helper="Assunto mais recorrente"
          tone="hot"
        />
      </div>

      <ContextHelpCard 
        title="Como analisar as pautas"
        whatIsThis="Este é o mapa de assuntos que mais surgem nas conversas da equipe com o território."
        whyItMatters="Ajuda a organização a entender quais pautas puxam bairros, quais viram missão de campo e quais já pedem continuidade."
        whatToDoNow="Explore as categorias para ver volume, ligação territorial e conversão em missões presenciais."
        className="mb-8"
      />

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <Card className="rounded-[28px] border-zinc-200 shadow-sm lg:col-span-3">
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Conexão com o mapa</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">Temas que puxam bairros e campo</h3>
              </div>
              <div className="flex gap-2 text-xs font-bold text-zinc-500">
                <Link href="/territorios" className="rounded-full border border-zinc-200 px-3 py-2 hover:border-indigo-200 hover:text-indigo-700">
                  Ver mapa territorial
                </Link>
                <Link href="/campo" className="rounded-full border border-zinc-200 px-3 py-2 hover:border-indigo-200 hover:text-indigo-700">
                  Ver missões de campo
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {topicConnections.slice(0, 3).map(({ category, relatedTerritories, relatedFieldEvents, continuityTerritories }) => (
                <div key={category.id} className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Tema em destaque</p>
                      <h4 className="mt-2 text-lg font-black text-zinc-950">{category.name}</h4>
                    </div>
                    <div className="h-3 w-10 rounded-full" style={{ backgroundColor: category.color ?? "#94a3b8" }} />
                  </div>

                  <div className="mt-5 space-y-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Bairros puxados</p>
                      <p className="mt-2 text-sm font-black text-zinc-950">{relatedTerritories.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Missões de campo geradas</p>
                      <p className="mt-2 text-sm font-black text-zinc-950">{relatedFieldEvents.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Continuidade ativa</p>
                      <p className="mt-2 text-sm font-black text-zinc-950">{continuityTerritories.length}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/temas/${category.slug}`}>
            <Card className="h-full border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-1 bg-white ring-1 ring-zinc-100 group overflow-hidden">
              <div 
                className="h-1.5 w-full" 
                style={{ backgroundColor: category.color ?? "#94a3b8" }}
              />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">
                  {category.name}
                </CardTitle>
                <Hash className="h-4 w-4 text-zinc-300 group-hover:text-indigo-400 transition-colors" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                  {category.description ?? "Sem descrição."}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-indigo-950">{countByTopic[category.id] || 0}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Interações</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    Explorar <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {categories.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl">
             <Hash className="h-12 w-12 text-zinc-200 mb-4" />
             <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Nenhuma categoria encontrada.</p>
          </div>
        ) : null}
      </div>

      <div className="mt-10 grid gap-6">
        {topicConnections.map(({ category, relatedTerritories, relatedFieldEvents, continuityTerritories }) => (
          <Card key={category.id} className="rounded-[28px] border-zinc-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-12 rounded-full" style={{ backgroundColor: category.color ?? "#94a3b8" }} />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Rede temática</p>
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-zinc-950">{category.name}</h3>
                  <p className="max-w-2xl text-sm font-medium text-zinc-500">
                    {category.description ?? "Tema ativo sem descrição cadastrada."}
                  </p>
                </div>
                <Button nativeButton={false} variant="outline" className="font-bold border-zinc-200" render={<Link href={`/temas/${category.slug}`} />}>
                  Explorar tema <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Bairros puxados</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {relatedTerritories.length > 0 ? (
                      relatedTerritories.map((territory) => (
                        <Badge key={`${category.id}-${territory.neighborhood}`} variant="outline" className="border-zinc-200 bg-white text-zinc-700">
                          {territory.neighborhood} · {territory.phase}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm font-medium text-zinc-500">Ainda sem conexão territorial forte.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Campo gerado</p>
                  <div className="mt-3 space-y-2">
                    {relatedFieldEvents.length > 0 ? (
                      relatedFieldEvents.slice(0, 4).map((event) => (
                        <div key={event.id} className="rounded-2xl border border-zinc-100 bg-white px-3 py-2">
                          <p className="text-sm font-black text-zinc-950">{event.title}</p>
                          <p className="text-[11px] font-medium text-zinc-500">{event.neighborhood || "Território em definição"}</p>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm font-medium text-zinc-500">Ainda não virou missão de campo.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Continuidade</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {continuityTerritories.length > 0 ? (
                      continuityTerritories.map((territory) => (
                        <Badge key={`${category.id}-cont-${territory.neighborhood}`} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {territory.neighborhood}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm font-medium text-zinc-500">Sem território em continuidade por este tema.</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
