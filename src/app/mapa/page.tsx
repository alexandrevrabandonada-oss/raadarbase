import Link from "next/link";
import { Grid2X2, ListFilter, MapPin, Search, Tag } from "lucide-react";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar, FilterPill } from "@/components/ui/filter-bar";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  await requireInternalPageSession("/mapa");
  const events = await listFieldAgendaEvents().catch(() => []);
  const neighborhoods = new Map<string, { actions: number; topics: Set<string>; status: string; last: string | null }>();
  const topicCounts = new Map<string, number>();

  for (const event of events) {
    const key = event.neighborhood ?? "Sem territorio";
    const current = neighborhoods.get(key) ?? { actions: 0, topics: new Set<string>(), status: "Pendente", last: null };
    current.actions += 1;
    if (event.topicSlug) {
      current.topics.add(event.topicSlug);
      topicCounts.set(event.topicSlug, (topicCounts.get(event.topicSlug) ?? 0) + 1);
    }
    if (event.status === "done") current.status = "Escutado";
    else if (event.status === "planned" && current.status !== "Escutado") current.status = "Em revisao";
    current.last = event.startsAt ?? event.createdAt ?? current.last;
    neighborhoods.set(key, current);
  }

  const territories = Array.from(neighborhoods.entries());
  const topTopics = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Mapa-lista"
        title="Territorios em leitura operacional."
        description="Mapa-lista sem precisao geografica. Nao ha geocodificacao nem pontos individuais."
        actions={<Button nativeButton={false} render={<Link href="/campo" />}>Abrir agenda</Button>}
        filters={
          <FilterBar>
            <FilterPill icon={<Search className="h-4 w-4" />} label="Busca" value="Buscar territorio" />
            <FilterPill icon={<ListFilter className="h-4 w-4" />} label="Status" value="Todos os status" />
            <FilterPill icon={<Grid2X2 className="h-4 w-4" />} label="Visualizacao" value="Cards compactos" />
          </FilterBar>
        }
      />

      <section className="rounded-2xl border border-[#e5dac8] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-[#f8f2e6] p-4 text-sm text-[#4f6259]">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0b5a3f]" />
          <p>Mapa-lista sem precisao geografica. A leitura abaixo resume bairros, temas e status operacionais, sem pontos individuais.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {territories.length > 0 ? (
              territories.map(([name, territory]) => (
                <Card key={name} className="rounded-2xl border-[#eadfce] shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black text-[#0b3326]">{name}</h2>
                        <p className="mt-1 text-sm text-[#65756c]">
                          {Array.from(territory.topics).slice(0, 2).join(", ") || "Sem tema predominante"}
                        </p>
                      </div>
                      <Badge variant="outline">{territory.status}</Badge>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#eee4d7] pt-3 text-sm sm:grid-cols-4">
                      <StatItem label="Escutas" value={String(territory.actions)} />
                      <StatItem label="Temas" value={String(territory.topics.size)} />
                      <StatItem label="Status" value={territory.status} />
                      <StatItem label="Ultima" value={territory.last ? new Date(territory.last).toLocaleDateString("pt-BR") : "--"} />
                    </dl>
                    <Button variant="outline" nativeButton={false} render={<Link href="/territorios" />} className="mt-4 h-11 w-full rounded-xl">
                      Ver detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d9cbb7] p-8 text-center md:col-span-2">
                <p className="font-black text-[#0b3326]">Nenhum territorio com acao registrada neste recorte.</p>
                <p className="mt-2 text-sm text-[#65756c]">Comece cadastrando uma acao de campo ou digitando fichas de escuta.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="rounded-2xl border-[#eadfce] shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  Ranking de temas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topTopics.length ? (
                  topTopics.map(([topic, count]) => (
                    <div key={topic} className="flex items-center justify-between rounded-xl border border-[#eee4d7] bg-[#fffdf9] px-3 py-3 text-sm">
                      <span className="font-semibold text-[#173a2d]">{topic}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#65756c]">Sem temas suficientes para ranking agora.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-[#eadfce] shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Palavras recorrentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(topTopics.length ? topTopics.map(([topic]) => topic) : ["escuta", "bairro", "devolutiva"]).map((word) => (
                    <Badge key={word} variant="outline" className="shrink-0 rounded-full bg-[#fbf7ef] px-3 py-1.5">
                      {word}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6d3a]">{label}</dt>
      <dd className="mt-1 font-semibold text-[#173a2d]">{value}</dd>
    </div>
  );
}
