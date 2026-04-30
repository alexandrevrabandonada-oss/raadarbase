/* eslint-disable @typescript-eslint/no-explicit-any */
import AppShell from "@/components/app-shell";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getStrategicMemory } from "@/lib/data/strategic-memory";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft, 
  Archive, 
  Download, 
  Calendar, 
  MapPin, 
  Tag, 
  Link as LinkIcon,
  Clock,
  User,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function MemoriaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireInternalPageSession("/memoria/[id]");
  const { id } = await params;

  const memory = await getStrategicMemory(id);
  if (!memory) notFound();

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/memoria" />}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={`/api/strategic-memory/${id}/export?format=markdown`} download />}
            >
              <Download className="h-4 w-4 mr-2" /> Exportar MD
            </Button>
            {memory.status !== 'archived' && (
              <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                <Archive className="h-4 w-4 mr-2" /> Arquivar
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Card>
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
                <CardTitle className="text-2xl mt-2">{memory.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-indigo max-w-none italic text-indigo-900 bg-indigo-50/30 p-6 rounded-lg border border-indigo-100 whitespace-pre-wrap">
                  &quot;{memory.summary}&quot;
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" /> Território
                    </h3>
                    <p className="text-muted-foreground">{memory.territory || "Não especificado"}</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" /> Período
                    </h3>
                    <p className="text-muted-foreground">
                      {memory.period_start ? new Date(memory.period_start).toLocaleDateString('pt-BR') : '...'} 
                      {memory.period_end ? ` até ${new Date(memory.period_end).toLocaleDateString('pt-BR')}` : ''}
                      {!memory.period_start && !memory.period_end && "Não especificado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-muted-foreground" /> Vínculos e Origens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(memory.links?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhum vínculo direto registrado.</p>
                  ) : (
                    <div className="grid gap-2">
                      {memory.links?.map((link: any) => (
                        <div key={link.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px] uppercase">{link.entity_type.replace('_', ' ')}</Badge>
                            <span className="text-xs font-mono text-muted-foreground">{link.entity_id.slice(0, 8)}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/${link.entity_type === 'action_plan' ? 'acoes' : link.entity_type === 'report' ? 'relatorios' : 'dashboard'}/${link.entity_id}`} />}
                          >
                            Acessar <ArrowRight className="h-3 w-3 ml-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Metadados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Criado por
                  </span>
                  <span className="font-semibold">{memory.created_by_email || "Sistema"}</span>
                </div>
                <Separator />
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Registrado em
                  </span>
                  <span className="font-semibold">{new Date(memory.created_at).toLocaleString('pt-BR')}</span>
                </div>
                {memory.archived_at && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <Archive className="h-3 w-3" /> Arquivado em
                      </span>
                      <span className="font-semibold text-amber-700">{new Date(memory.archived_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="p-4 bg-indigo-100/50 border border-indigo-200 rounded-lg text-indigo-900 text-[10px]">
              <p className="font-bold uppercase mb-1 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> Memória Coletiva
              </p>
              Esta memória consolida aprendizados estratégicos. Toda exportação e acesso é auditado para garantir o uso ético dos dados operacionais.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
