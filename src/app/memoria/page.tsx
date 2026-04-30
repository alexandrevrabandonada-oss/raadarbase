import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listStrategicMemories } from "@/lib/data/strategic-memory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { 
  Plus, 
  Lightbulb, 
  Search, 
  Calendar, 
  MapPin, 
  Tag,
  ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function MemoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tema?: string }>;
}) {
  await requireInternalPageSession("/memoria");
  const { q, tema } = await searchParams;

  const memories = await listStrategicMemories({
    search: q,
    topic_id: tema,
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Memória Estratégica"
            description="Acúmulo de aprendizados coletivos para guiar as próximas ações da organização."
          />
          <div className="flex gap-2">
            <Link href="/memoria/sugestoes" className={buttonVariants({ variant: "outline" })}>
              <Lightbulb className="h-4 w-4 mr-2" /> Sugerir a partir dos resultados
            </Link>
            <Button nativeButton={false} render={<Link href="/memoria/nova" />}>
              <Plus className="h-4 w-4 mr-2" /> Nova Memória
            </Button>
          </div>
        </div>

        <Card className="border-indigo-100 bg-indigo-50/20">
          <CardContent className="pt-6">
            <form className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Buscar em aprendizados, títulos ou territórios..."
                  className="pl-9"
                  defaultValue={q}
                />
              </div>
              <Button type="submit">Filtrar</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {memories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nenhuma memória estratégica encontrada para estes filtros.</p>
                <Button variant="link" className="mt-2" nativeButton={false} render={<Link href="/memoria/nova" />}>
                  Comece registrando o primeiro aprendizado
                </Button>
              </CardContent>
            </Card>
          ) : (
            memories.map((memory) => (
              <Link key={memory.id} href={`/memoria/${memory.id}`} className="group block">
                <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-bold uppercase text-indigo-600">
                          {memory.topic?.name || "Geral"}
                        </span>
                      </div>
                      <Badge variant={memory.status === 'active' ? 'default' : 'secondary'}>
                        {memory.status === 'active' ? 'Ativa' : 'Arquivada'}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2 group-hover:text-indigo-600 transition-colors">
                      {memory.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 italic">
                      &quot;{memory.summary}&quot;
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {memory.territory && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.3 w-3.3" />
                          {memory.territory}
                        </div>
                      )}
                      {(memory.period_start || memory.period_end) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.3 w-3.3" />
                          {memory.period_start ? new Date(memory.period_start).toLocaleDateString('pt-BR') : '...'} 
                          {memory.period_end ? ` até ${new Date(memory.period_end).toLocaleDateString('pt-BR')}` : ''}
                        </div>
                      )}
                      <div className="ml-auto flex items-center text-indigo-600 font-bold">
                        Ver detalhes <ArrowRight className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
