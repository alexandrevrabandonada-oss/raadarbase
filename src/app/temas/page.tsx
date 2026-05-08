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
import { ListChecks } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemasPage() {
  await requireInternalPageSession("/temas");

  const categories = await listTopicCategories();
  
  // Buscar contagens de interações por tema
  let countByTopic: Record<string, number> = {};
  if (!shouldUseMockData()) {
    const supabase = getSupabaseAdminClient();
    const { data: counts } = await supabase
      .from("interaction_topic_tags")
      .select("topic_id");

    countByTopic = (counts ?? []).reduce((acc: Record<string, number>, curr) => {
      acc[curr.topic_id] = (acc[curr.topic_id] || 0) + 1;
      return acc;
    }, {});
  }

  
  return (
    <AppShell>
      <RadarPageHeader
        eyebrow="Taxonomia Territorial"
        title="Temas e Pautas"
        description="Assuntos públicos detectados nas interações. Foco no conteúdo, não no cidadão."
        actions={
          <Button nativeButton={false} className="bg-indigo-600 hover:bg-indigo-700 font-bold" render={<Link href="/temas/revisao" />}>
            <ListChecks className="mr-2 h-4 w-4" />
            Revisar tags pendentes
          </Button>
        }
      />


      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/temas/${category.slug}`}>
            <Card className="h-full cursor-pointer hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {category.name}
                </CardTitle>
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: category.color ?? "#94a3b8" }}
                />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  {category.description ?? "Sem descrição."}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {countByTopic[category.id] || 0} interações
                  </Badge>
                  <span className="text-xs text-muted-foreground">Ver mais →</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center col-span-full">
            Nenhuma categoria de tema encontrada.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
