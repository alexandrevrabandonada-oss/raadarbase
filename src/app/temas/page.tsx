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
        description="Assuntos públicos identificados. Foco no conteúdo, não na pessoa."
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
        whyItMatters="Ajuda a organização a entender as dores reais da população sem focar em indivíduos, permitindo criar propostas mais precisas."
        whatToDoNow="Explore as categorias para ver o volume de interações. Temas com muitos sinais podem virar novos Planos de Ação."
        className="mb-8"
      />


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
    </AppShell>
  );
}
