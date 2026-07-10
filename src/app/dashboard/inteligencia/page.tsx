import Link from "next/link";
import { Activity, Boxes, Download, Network, Search, ShieldCheck } from "lucide-react";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listRadarEntities } from "@/lib/radar-hub/data";
import { ENTITY_TYPE_LABELS, RADAR_CATEGORIES, RADAR_CATEGORY_LABELS, RADAR_ENTITY_TYPES, RADAR_SOURCE_TYPES, type RadarCategory, type RadarEntityType, type RadarSourceType } from "@/lib/radar-hub/types";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";
type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function numberValue(value: string | undefined) { const number = Number(value); return value && Number.isFinite(number) ? number : undefined; }
function queryWith(params: SearchParams, changes: Record<string, string>) {
  const result = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []));
  for (const [key, value] of Object.entries(changes)) result.set(key, value);
  return result.toString();
}

export default async function IntelligencePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireInternalPageSession("/dashboard/inteligencia");
  const params = await searchParams;
  const entityType = first(params.entityType); const category = first(params.category); const sourceType = first(params.sourceType);
  let data;
  try {
    data = await listRadarEntities({
      q: first(params.q), city: first(params.city), state: first(params.state), region: first(params.region),
      entityType: RADAR_ENTITY_TYPES.includes(entityType as RadarEntityType) ? entityType as RadarEntityType : undefined,
      category: RADAR_CATEGORIES.includes(category as RadarCategory) ? category as RadarCategory : undefined,
      sourceType: RADAR_SOURCE_TYPES.includes(sourceType as RadarSourceType) ? sourceType as RadarSourceType : undefined,
      minScore: numberValue(first(params.minScore)), maxScore: numberValue(first(params.maxScore)),
      hasRelationship: first(params.hasRelationship) === "true" ? true : first(params.hasRelationship) === "false" ? false : undefined,
      page: numberValue(first(params.page)), pageSize: 50,
      sort: first(params.sort) === "name" ? "name" : first(params.sort) === "confidence" ? "confidence" : first(params.sort) === "updated" ? "updated" : "score",
      direction: first(params.direction) === "asc" ? "asc" : "desc",
    });
  } catch (error) {
    return <AppShell><PageHeader eyebrow="Inteligência territorial" title="Hub de Fontes" description="Entidades, evidências e relações com rastreabilidade." /><RuntimeAlert title="Falha ao carregar o Hub" description={error instanceof Error ? error.message : "Consulta indisponível."} /></AppShell>;
  }
  const exportQuery = queryWith(params, {});
  const cards = [
    ["Entidades", data.kpis.totalEntities.toLocaleString("pt-BR"), Boxes],
    ["Score médio", data.kpis.averageScore.toFixed(1), Activity],
    ["Confiança média", `${Math.round(data.kpis.averageConfidence * 100)}%`, ShieldCheck],
    ["Revisão humana", data.kpis.needsReview.toLocaleString("pt-BR"), Network],
    ["Fila de enriquecimento", data.kpis.pendingEnrichment.toLocaleString("pt-BR"), Activity],
  ] as const;
  const quickViews = [
    ["Lideranças territoriais", "?sort=score&direction=desc"], ["Organizações", "?entityType=organization"],
    ["Imprensa", "?category=veiculo_de_imprensa"], ["Educação", "?category=educacao"],
    ["Saúde", "?category=saude"], ["Cultura", "?category=cultura"], ["Sindicatos", "?category=sindicato"],
    ["Comércio", "?category=comercio"], ["Ambiental", "?category=ambiental"],
    ["Volta Redonda", "?city=Volta+Redonda"], ["Barra Mansa", "?city=Barra+Mansa"], ["Sul Fluminense", "?region=Sul+Fluminense"],
  ] as const;
  const distributions = [
    ["Entidades por tipo", data.facets.entityTypes], ["Top por cidade", data.facets.cities], ["Registros por fonte", data.facets.sources],
  ] as const;
  return <AppShell>
    <PageHeader eyebrow="Inteligência territorial" title="Hub de Fontes e Enriquecimento" description="Visão unificada, explicável e auditável das entidades públicas do Radar." action={<div className="flex gap-2"><Button variant="outline" nativeButton={false} render={<Link href="/dashboard/inteligencia/fontes" />}>Fontes</Button><Button nativeButton={false} render={<Link href="/dashboard/inteligencia/grafo" />}><Network data-icon="inline-start" />Grafo</Button></div>} />
    <div className="flex flex-col gap-6 pb-12">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, Icon]) => <Card key={label}><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="flex items-center justify-between"><span className="font-mono text-3xl">{value}</span><Icon className="text-burnt-yellow" /></CardTitle></CardHeader></Card>)}</section>
      <Card><CardHeader><CardTitle>Recortes territoriais</CardTitle><CardDescription>Atalhos para rankings por setor, cidade e região.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2">{quickViews.map(([label, href]) => <Button key={label} variant="outline" size="sm" nativeButton={false} render={<Link href={`/dashboard/inteligencia${href}`} />}>{label}</Button>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Busca operacional</CardTitle><CardDescription>Filtre sem perder a origem e a confiança de cada informação.</CardDescription></CardHeader><CardContent><form method="get"><FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field className="xl:col-span-2"><FieldLabel htmlFor="q">Nome ou descrição</FieldLabel><Input id="q" name="q" defaultValue={first(params.q)} placeholder="Busque uma entidade" /></Field>
        <Field><FieldLabel htmlFor="entityType">Tipo</FieldLabel><select id="entityType" name="entityType" defaultValue={entityType ?? ""} className="h-10 rounded-[4px] border-2 border-input bg-background px-3 text-sm"><option value="">Todos</option>{RADAR_ENTITY_TYPES.map((item) => <option key={item} value={item}>{ENTITY_TYPE_LABELS[item]}</option>)}</select></Field>
        <Field><FieldLabel htmlFor="category">Categoria</FieldLabel><select id="category" name="category" defaultValue={category ?? ""} className="h-10 rounded-[4px] border-2 border-input bg-background px-3 text-sm"><option value="">Todas</option>{RADAR_CATEGORIES.map((item) => <option key={item} value={item}>{RADAR_CATEGORY_LABELS[item]}</option>)}</select></Field>
        <Field><FieldLabel htmlFor="city">Cidade</FieldLabel><Input id="city" name="city" defaultValue={first(params.city)} /></Field>
        <Field><FieldLabel htmlFor="sourceType">Fonte</FieldLabel><select id="sourceType" name="sourceType" defaultValue={sourceType ?? ""} className="h-10 rounded-[4px] border-2 border-input bg-background px-3 text-sm"><option value="">Todas</option>{RADAR_SOURCE_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
        <Field><FieldLabel htmlFor="minScore">Score mínimo</FieldLabel><Input id="minScore" name="minScore" type="number" min="0" max="100" defaultValue={first(params.minScore)} /></Field>
        <Field><FieldLabel htmlFor="hasRelationship">Relações</FieldLabel><select id="hasRelationship" name="hasRelationship" defaultValue={first(params.hasRelationship) ?? ""} className="h-10 rounded-[4px] border-2 border-input bg-background px-3 text-sm"><option value="">Qualquer</option><option value="true">Com relações</option><option value="false">Sem relações</option></select></Field>
        <div className="flex items-end gap-2 xl:col-span-4"><Button type="submit"><Search data-icon="inline-start" />Aplicar</Button><Button variant="ghost" nativeButton={false} render={<Link href="/dashboard/inteligencia" />}>Limpar</Button></div>
      </FieldGroup></form></CardContent></Card>
      <Card className="min-w-0"><CardHeader><CardTitle>Ranking territorial</CardTitle><CardDescription>{data.total.toLocaleString("pt-BR")} resultados · página {data.page} de {data.totalPages}</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Entidade</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead>Território</TableHead><TableHead>Confiança</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader><TableBody>{data.items.map((entity) => <TableRow key={entity.id}><TableCell><Link className="font-black hover:text-burnt-yellow" href={`/dashboard/inteligencia/entidades/${entity.id}`}>{entity.display_name}</Link></TableCell><TableCell>{ENTITY_TYPE_LABELS[entity.entity_type]}</TableCell><TableCell><Badge variant="secondary">{RADAR_CATEGORY_LABELS[entity.main_category]}</Badge></TableCell><TableCell>{entity.primary_city ?? "Não informada"}{entity.primary_state ? `/${entity.primary_state}` : ""}</TableCell><TableCell>{Math.round(entity.confidence_score * 100)}%</TableCell><TableCell className="text-right font-mono font-black">{entity.influence_score.toFixed(1)}</TableCell></TableRow>)}</TableBody></Table></CardContent>
        <div className="flex flex-wrap justify-between gap-3 border-t-2 border-cement p-4"><div className="flex gap-2"><Button variant="outline" size="sm" disabled={data.page <= 1} nativeButton={data.page <= 1} render={data.page > 1 ? <Link href={`?${queryWith(params, { page: String(data.page - 1) })}`} /> : undefined}>Anterior</Button><Button variant="outline" size="sm" disabled={data.page >= data.totalPages} nativeButton={data.page >= data.totalPages} render={data.page < data.totalPages ? <Link href={`?${queryWith(params, { page: String(data.page + 1) })}`} /> : undefined}>Próxima</Button></div><div className="flex gap-2"><Button size="sm" variant="outline" nativeButton={false} render={<a href={`/api/radar/entities?${exportQuery}&format=csv`} />}><Download data-icon="inline-start" />CSV</Button><Button size="sm" variant="outline" nativeButton={false} render={<a href={`/api/radar/entities?${exportQuery}&format=excel`} />}>Excel</Button><Button size="sm" variant="outline" nativeButton={false} render={<a href={`/api/radar/entities?${exportQuery}&format=json`} />}>JSON</Button></div></div>
      </Card>
      <section className="grid gap-4 lg:grid-cols-3">{distributions.map(([title, values]) => <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-2">{Object.entries(values).toSorted((left, right) => right[1] - left[1]).slice(0, 8).map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3"><span className="truncate text-sm">{label}</span><Badge variant="secondary">{value}</Badge></div>)}</CardContent></Card>)}</section>
    </div>
  </AppShell>;
}
