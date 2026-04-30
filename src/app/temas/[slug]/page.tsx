import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notFound } from "next/navigation";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getTopicBySlug, listInteractionsByTopic, TopicCategoryRow } from "@/lib/data/topics";
import { formatDateTime } from "@/lib/mock-data";
import { AlertCircle, Lightbulb } from "lucide-react";
import { listStrategicMemories } from "@/lib/data/strategic-memory";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TemaDetalhePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  await requireInternalPageSession(`/temas/${slug}`);

  const topic = (await getTopicBySlug(slug)) as TopicCategoryRow | null;
  if (!topic) notFound();

  const interactions = await listInteractionsByTopic(topic.id);

  const memories = await listStrategicMemories({ topic_id: topic.id, status: 'active' });

  return (
    <AppShell>
      <PageHeader
        title={`Tema: ${topic.name}`}
        description={topic.description ?? "Análise de interações públicas sobre esta pauta."}
      />

      <div className="grid gap-6 mb-6 lg:grid-cols-2">
        <Card className="border-indigo-500/20 bg-indigo-50/30">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-indigo-600" />
              Aprendizados Acumulados
            </CardTitle>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/memoria?tema=${topic.id}`} />}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {memories.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">Nenhum aprendizado estratégico consolidado para este tema.</p>
            ) : (
              <div className="space-y-3">
                {memories.slice(0, 3).map(memory => (
                  <Link key={memory.id} href={`/memoria/${memory.id}`} className="block p-3 rounded-md border bg-background hover:border-indigo-400 transition-colors">
                    <p className="text-sm font-bold truncate">{memory.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1 italic">&quot;{memory.summary}&quot;</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-50/50 flex flex-col justify-center">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-bold">Aviso de Governança:</p>
              <p className="mt-1">
                Esta lista é baseada exclusivamente em interações públicas. Ela ajuda a identificar demandas coletivas e 
                <strong> não representa o perfil político ou ideológico pessoal das pessoas listadas</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interações recentes sobre esta pauta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(interactions as any[]).map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="text-xs">
                      {formatDateTime(tag.interaction.occurred_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tag.interaction.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm italic">
                      &quot;{tag.interaction.text_content || "(Sem texto)"}&quot;
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Link para detalhe da interação ou pessoa se necessário */}
                    </TableCell>
                  </TableRow>
                ))}
                {interactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhuma interação confirmada para este tema ainda.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
