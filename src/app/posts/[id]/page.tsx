import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listPosts } from "@/lib/data/posts";
import { formatDateTime } from "@/lib/mock-data";
import { ExternalLink, MessageSquare, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PostDetalhePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  await requireInternalPageSession(`/posts/${id}`);

  // Usando listPosts e filtrando para simplificar o tijolo sem criar getPostById novo
  const allPosts = await listPosts();
  const post = allPosts.find(p => p.id === id);
  if (!post) notFound();

  return (
    <AppShell>
      <PageHeader
        title="Detalhes do Post"
        description={`Publicado em ${formatDateTime(post.publishedAt || "")}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Conteúdo
              <Badge variant="outline">{post.topic}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {post.caption || "(Sem legenda)"}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <a 
                href={post.permalink ?? "#"} 
                target="_blank" 
                className="text-sm text-blue-600 hover:underline flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" /> Abrir no Instagram original
              </a>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <MessageSquare className="h-4 w-4" /> {post.comments} comentários
                </span>
                <span>{post.interactions} interações totais</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temas Associados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>{post.topic}</Badge>
                {/* Futuramente listar tags de post_topic_tags */}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Estes temas são herdados da pauta principal do post e das interações confirmadas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-50/50">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-900 leading-tight">
                <strong>Ação Recomendada:</strong> Revise os comentários deste post na fila de temas 
                para garantir que a escuta pública esteja classificada corretamente.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
