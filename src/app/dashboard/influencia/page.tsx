import Link from "next/link";
import { BarChart3, Building2, Download, MapPin, Newspaper, Search, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { buildDistribution } from "@/lib/influence/export";
import { listInfluenceProfiles } from "@/lib/influence/data";
import { CATEGORY_LABELS, INFLUENCE_CATEGORIES, type InfluenceCategory } from "@/lib/influence/types";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { InfluenceActions } from "./influence-actions";
import { VirtualizedProfileTable } from "./virtualized-profile-table";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
const quickRankings = [
  ["Top 100", "?pageSize=100"], ["Top Volta Redonda", "?cidade=Volta+Redonda&pageSize=100"],
  ["Top Barra Mansa", "?cidade=Barra+Mansa&pageSize=100"], ["Top Resende", "?cidade=Resende&pageSize=100"],
  ["Top Sul Fluminense", "?regiao=sul-fluminense&pageSize=100"], ["Top Empresas", "?categoria=empresa&pageSize=100"],
  ["Top Imprensa", "?categoria=jornalista&pageSize=100"], ["Top Política", "?categoria=politico&pageSize=100"],
  ["Top Sindicatos", "?categoria=sindicato&pageSize=100"], ["Top Professores", "?categoria=professor&pageSize=100"],
  ["Top Médicos", "?categoria=medico&pageSize=100"], ["Top Comércio", "?categoria=comercio&pageSize=100"],
] as const;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function asNumber(value: string | undefined) { if (value === undefined || value.trim() === "") return undefined; const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined; }
function formatNumber(value: number) { return new Intl.NumberFormat("pt-BR", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value); }

export default async function InfluenceDashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireInternalPageSession("/dashboard/influencia");
  const params = await searchParams;
  const category = first(params.categoria);
  const filters = {
    query: first(params.q), cidade: first(params.cidade), estado: first(params.estado), regiao: first(params.regiao) === "sul-fluminense" ? "sul-fluminense" as const : undefined,
    categoria: INFLUENCE_CATEGORIES.includes(category as InfluenceCategory) ? category as InfluenceCategory : undefined,
    minScore: asNumber(first(params.minScore)), maxScore: asNumber(first(params.maxScore)),
    minSeguidores: asNumber(first(params.minSeguidores)), maxSeguidores: asNumber(first(params.maxSeguidores)),
    page: asNumber(first(params.page)), pageSize: asNumber(first(params.pageSize)),
    sort: first(params.sort) === "seguidores" ? "seguidores" as const : "score" as const,
    direction: first(params.direction) === "asc" ? "asc" as const : "desc" as const,
  };
  let data;
  try { data = await listInfluenceProfiles(filters); }
  catch (error) {
    return <AppShell><PageHeader eyebrow="CRM de influência" title="Radar de Influência" description="Perfis públicos e listas legitimamente importadas." /><RuntimeAlert title="Falha ao carregar o radar" description={error instanceof Error ? error.message : "Não foi possível consultar os perfis."} /></AppShell>;
  }
  const categoryDistribution = buildDistribution(data.items, "categoria").slice(0, 5);
  const cityDistribution = buildDistribution(data.items, "cidade").slice(0, 5);
  const followerDistribution = buildDistribution(data.items, "faixa");
  const exportQuery = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : [])).toString();
  const kpiCards: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: "Total de perfis", value: formatNumber(data.kpis.totalProfiles), icon: Users },
    { label: "Seguidores somados", value: formatNumber(data.kpis.totalFollowers), icon: TrendingUp },
    { label: "Média de seguidores", value: formatNumber(data.kpis.averageFollowers), icon: BarChart3 },
  ];
  const distributionCards: Array<{ title: string; rows: Array<{ label: string; value: number }>; icon: LucideIcon }> = [
    { title: "Distribuição por categoria", rows: categoryDistribution, icon: Building2 },
    { title: "Distribuição por cidade", rows: cityDistribution, icon: MapPin },
    { title: "Faixas de seguidores", rows: followerDistribution, icon: Newspaper },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="CRM de influência" title="Radar de Influência" description="Ranking explicável de perfis públicos e bases importadas com origem legítima." />
      <div className="flex flex-col gap-6 pb-12">
        <section className="grid gap-4 md:grid-cols-3">
          {kpiCards.map(({ label, value, icon: Icon }) => (
            <Card key={label}><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="flex items-center justify-between"><span className="font-mono text-3xl">{value}</span><Icon /></CardTitle></CardHeader></Card>
          ))}
        </section>

        <Card>
          <CardHeader><CardTitle>Rankings rápidos</CardTitle><CardDescription>Recortes operacionais sobre a mesma base autorizada.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">{quickRankings.map(([label, href]) => <Button key={label} variant="outline" size="sm" nativeButton={false} render={<Link href={`/dashboard/influencia${href}`} />}>{label}</Button>)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Busca e filtros</CardTitle><CardDescription>Nome, username, categoria, cidade, estado, score e seguidores.</CardDescription></CardHeader>
          <CardContent>
            <form method="get" key={JSON.stringify(filters)}>
              <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field className="xl:col-span-2"><FieldLabel htmlFor="q">Busca</FieldLabel><Input id="q" name="q" defaultValue={filters.query} placeholder="Nome, @username ou bio" /></Field>
                <Field><FieldLabel htmlFor="categoria">Categoria</FieldLabel><select id="categoria" name="categoria" defaultValue={filters.categoria ?? ""} className="h-10 rounded-[4px] border-2 border-input bg-background px-3 text-sm"><option value="">Todas</option>{INFLUENCE_CATEGORIES.map((item) => <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>)}</select></Field>
                <Field><FieldLabel htmlFor="cidade">Cidade</FieldLabel><Input id="cidade" name="cidade" defaultValue={filters.cidade} list="influence-cities" /><datalist id="influence-cities">{data.cities.map((city) => <option key={city} value={city} />)}</datalist></Field>
                <Field><FieldLabel htmlFor="estado">Estado</FieldLabel><Input id="estado" name="estado" maxLength={2} defaultValue={filters.estado} placeholder="RJ" /></Field>
                <Field><FieldLabel htmlFor="minSeguidores">Seguidores mínimos</FieldLabel><Input id="minSeguidores" name="minSeguidores" type="number" min="0" defaultValue={filters.minSeguidores} /></Field>
                <Field><FieldLabel htmlFor="maxSeguidores">Seguidores máximos</FieldLabel><Input id="maxSeguidores" name="maxSeguidores" type="number" min="0" defaultValue={filters.maxSeguidores} /></Field>
                <Field><FieldLabel htmlFor="minScore">Score mínimo</FieldLabel><Input id="minScore" name="minScore" type="number" min="0" step="0.1" defaultValue={filters.minScore} /></Field>
                <Field><FieldLabel htmlFor="maxScore">Score máximo</FieldLabel><Input id="maxScore" name="maxScore" type="number" min="0" step="0.1" defaultValue={filters.maxScore} /></Field>
                <div className="flex items-end gap-2 xl:col-span-4"><Button type="submit"><Search data-icon="inline-start" />Aplicar filtros</Button><Button variant="ghost" nativeButton={false} render={<Link href="/dashboard/influencia" />}>Limpar</Button></div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader><CardTitle>Ranking geral</CardTitle><CardDescription>{data.total.toLocaleString("pt-BR")} resultados · página {data.page} de {data.totalPages}. A lista renderiza apenas as linhas visíveis.</CardDescription></CardHeader>
          <CardContent className="p-0"><VirtualizedProfileTable profiles={data.items} /></CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-cement px-4 pt-4">
            <div className="flex gap-2"><Button variant="outline" size="sm" disabled={data.page <= 1} nativeButton={data.page <= 1} render={data.page > 1 ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, value]) => typeof value === "string")) as Record<string, string>, page: String(data.page - 1) })}`} /> : undefined}>Anterior</Button><Button variant="outline" size="sm" disabled={data.page >= data.totalPages} nativeButton={data.page >= data.totalPages} render={data.page < data.totalPages ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, value]) => typeof value === "string")) as Record<string, string>, page: String(data.page + 1) })}`} /> : undefined}>Próxima</Button></div>
            <div className="flex gap-2"><Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/influencia?${exportQuery}&format=csv`} />}><Download data-icon="inline-start" />CSV</Button><Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/influencia?${exportQuery}&format=excel`} />}>Excel</Button><Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/influencia?${exportQuery}&format=json`} />}>JSON</Button></div>
          </div>
        </Card>

        <section className="grid gap-4 lg:grid-cols-3">
          {distributionCards.map(({ title, rows, icon: Icon }) => (
            <Card key={title}><CardHeader><CardTitle className="flex items-center gap-2"><Icon />{title}</CardTitle></CardHeader><CardContent className="flex flex-col gap-2">{rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3"><span className="truncate text-sm">{row.label}</span><Badge variant="secondary">{row.value}</Badge></div>)}</CardContent></Card>
          ))}
        </section>

        <Card><CardHeader><CardTitle>Importação e atualização incremental</CardTitle><CardDescription>Sem scraping privado, bypass de autenticação, CAPTCHA ou mecanismos de segurança.</CardDescription></CardHeader><CardContent><InfluenceActions /></CardContent></Card>
      </div>
    </AppShell>
  );
}
