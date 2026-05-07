import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  FileCheck2,
  FileText,
  MapPin,
  MessageSquareText,
  Plus,
  Sprout,
  Tag,
} from "lucide-react";
import AppShell from "@/components/app-shell";
import { DashboardChart } from "@/components/dashboard-chart";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar, FilterPill } from "@/components/ui/filter-bar";
import { MetricCard } from "@/components/ui/metric-card";
import { interactionsByDay } from "@/lib/mock-data";
import { listActionPlans } from "@/lib/data/action-plans";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";
import { listPosts } from "@/lib/data/posts";
import { getStrategicMemoryStats } from "@/lib/data/strategic-memory";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

type TerritorySummary = {
  name: string;
  status: "Escutado" | "Em revisao" | "Pendente";
  actions: number;
  topics: Set<string>;
  lastListen: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function statusClass(status: TerritorySummary["status"]) {
  if (status === "Escutado") return "bg-emerald-50 text-emerald-800";
  if (status === "Em revisao") return "bg-amber-50 text-amber-800";
  return "bg-orange-50 text-orange-800";
}

export default async function DashboardPage() {
  await requireInternalPageSession("/dashboard");

  let loadedData: Awaited<ReturnType<typeof loadDashboardData>>;
  try {
    loadedData = await loadDashboardData();
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Dashboard de padroes" description="Painel interno de acompanhamento." />
        <RuntimeAlert
          title="Falha ao carregar dados"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar o dashboard."}
        />
      </AppShell>
    );
  }

  const {
    actionPlans,
    fieldEvents,
    totalInteractions,
    neighborhoods,
    pendingReview,
    recentActions,
    openDossiers,
    recurringTopics,
    maxTopic,
    visibleTerritories,
  } = loadedData;

  return (
      <AppShell>
        <PageHeader
          eyebrow="Dashboard de padroes"
          title="Sinteses territoriais para leitura coletiva."
          description="Indicadores calculados a partir das escutas e operacoes cadastradas. O painel organiza padroes para revisao e devolutiva ao territorio."
          actions={
            <Button nativeButton={false} render={<Link href="/acoes/novo" />} className="bg-[#f0b429] text-[#0b3326] hover:bg-[#d99d16]">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nova acao
            </Button>
          }
          filters={
            <FilterBar>
              <FilterPill icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />} label="Periodo" value="01/04/2026 - 30/04/2026" />
              <FilterPill icon={<MapPin className="h-4 w-4" aria-hidden="true" />} label="Bairro" value="Todos os bairros" />
              <FilterPill icon={<Tag className="h-4 w-4" aria-hidden="true" />} label="Tema" value="Todos os temas" />
            </FilterBar>
          }
        />

        <section className="mb-5 overflow-hidden rounded-xl border border-[#e5dac8] bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#073d2b] text-[#f0b429]">
                <Sprout className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-[#264b3b]">
                  Este painel reune os principais indicadores e padroes das escutas realizadas nos territorios.
                </p>
                <p className="mt-1 text-sm text-[#65756c]">
                  Use os filtros para explorar dados agregados e apoiar decisoes da equipe sem expor dados brutos.
                </p>
                <Link href="/ajuda" className="mt-2 inline-flex text-sm font-bold text-[#0b5a3f] hover:underline">
                  Saiba mais sobre os indicadores
                </Link>
              </div>
            </div>
            <div className="hidden h-20 w-80 rounded-xl bg-[linear-gradient(135deg,#e7f1e8,#f6eddb)] sm:block" aria-hidden="true" />
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-[#e5dac8] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a26615]">Proxima operacao</p>
              <h2 className="mt-1 text-2xl font-black text-[#0b3326]">Atalhos para homologacao e primeira banca</h2>
              <p className="text-sm text-[#607169]">Acompanhe dossies, escutas e proximas atividades da equipe.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/escutas/lote" className={buttonVariants({ className: "bg-[#073d2b] text-white hover:bg-[#0b4d37]" })}>
                Digitar fichas
              </Link>
              <Link href="/escutas" className={buttonVariants({ className: "bg-[#073d2b] text-white hover:bg-[#0b4d37]" })}>
                Revisar escutas
              </Link>
              <Link href="/relatorios" className={buttonVariants({ className: "bg-[#f0b429] text-[#0b3326] hover:bg-[#d99d16]" })}>
                Fechar dossie
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <OperationList title="Acoes recentes" count={recentActions.length} items={recentActions.map((event) => event.title)} empty="Sem acao recente neste recorte." />
            <OperationList title="Dossie aberto" count={openDossiers.length} items={openDossiers.map((plan) => plan.title)} empty="Nenhum dossie aberto agora." tone="amber" />
            <OperationList title="Devolutiva pendente" count={0} items={[]} empty="Nenhuma devolutiva pendente. Tudo em dia." tone="orange" />
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<ClipboardList className="h-5 w-5" />} label="Total de acoes" value={actionPlans.length + fieldEvents.length} note="acoes e operacoes cadastradas" />
          <MetricCard icon={<MessageSquareText className="h-5 w-5" />} label="Total de escutas" value={totalInteractions.toLocaleString("pt-BR")} note="sinais agregados de escuta" />
          <MetricCard icon={<FileCheck2 className="h-5 w-5" />} label="Pendencias de revisao" value={pendingReview} note="rascunhos e planos abertos" status={pendingReview > 0 ? "attention" : "calm"} />
          <MetricCard icon={<MapPin className="h-5 w-5" />} label="Bairros visitados" value={neighborhoods.size} note="territorios com acao registrada" />
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-4">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Temas mais recorrentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recurringTopics.map((topic) => (
                <div key={topic.name} className="grid grid-cols-[1fr_2.5fr_auto] items-center gap-3 text-sm">
                  <span className="font-semibold text-[#264b3b]">{topic.name}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[#edf1eb]">
                    <span className="block h-full rounded-full bg-[#0b5a3f]" style={{ width: `${(topic.value / maxTopic) * 100}%` }} />
                  </span>
                  <span className="font-bold">{topic.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Escutas por mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:hidden">
                {recurringTopics.slice(0, 3).map((topic) => (
                  <div key={topic.name} className="flex items-center justify-between rounded-xl border border-[#eee4d7] px-3 py-3 text-sm">
                    <span className="font-semibold text-[#173a2d]">{topic.name}</span>
                    <Badge variant="outline">{topic.value}</Badge>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <DashboardChart data={interactionsByDay} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Temas por bairro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {visibleTerritories.slice(0, 5).map((territory) => (
                <div key={territory.name} className="grid grid-cols-[1.2fr_1fr_auto] gap-2 border-b border-[#eee4d7] pb-2 last:border-0">
                  <span className="font-semibold">{territory.name}</span>
                  <span className="text-[#607169]">{Array.from(territory.topics)[0] ?? "sem tema"}</span>
                  <span className="font-bold">{territory.actions}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Palavras recorrentes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {["poluicao", "acesso a informacao", "agua", "coleta seletiva", "cuidar dos animais", "democratizar", "descontrole", "educacao ambiental"].map((word) => (
                <Badge key={word} variant="outline" className="rounded-full bg-[#faf7f0]">
                  {word}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 rounded-xl border border-[#e5dac8] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-[#0b3326]">
                <MapPin className="h-5 w-5" aria-hidden="true" />
                Mapa-lista territorial
              </h2>
              <p className="text-sm text-[#65756c]">Lista viva dos territorios escutados. Nao ha geocodificacao nem pontos individuais.</p>
            </div>
            <Link href="/mapa" className={buttonVariants({ variant: "outline" })}>
              Abrir mapa-lista
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {visibleTerritories.map((territory) => (
              <article key={territory.name} className="rounded-xl border border-[#e9dece] bg-[#fffdf9] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-[#0b3326]">{territory.name}</h3>
                    <p className="text-sm text-[#607169]">{Array.from(territory.topics).join(", ") || "Sem tema registrado"}</p>
                  </div>
                  <Badge className={statusClass(territory.status)}>{territory.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#eee4d7] pt-3 text-xs">
                  <MetricMini label="Escutas" value={territory.actions} />
                  <MetricMini label="Temas" value={territory.topics.size} />
                  <MetricMini label="Ultima" value={formatDate(territory.lastListen)} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-[#e5dac8] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[#e7f1e8] p-3 text-[#0b5a3f]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#0b3326]">Transparencia Viva</h2>
                <p className="text-sm text-[#65756c]">
                  Area publica futura para snapshots aprovados. Este bloco nao mostra dados brutos nem informacoes sensiveis.
                </p>
              </div>
            </div>
            <Link href="/transparencia/snapshots" className={buttonVariants({ variant: "outline" })}>
              Ver snapshots
            </Link>
          </div>
        </section>
      </AppShell>
  );
}

async function loadDashboardData() {
  const [posts, actionPlans, fieldEvents, memoryStats] = await Promise.all([
    listPosts(),
    listActionPlans().catch(() => []),
    listFieldAgendaEvents().catch(() => []),
    getStrategicMemoryStats().catch(() => ({ activeCount: 0, draftCount: 0, totalCount: 0 })),
  ]);

  const totalInteractions = posts.reduce((sum, post) => sum + (post.interactions ?? 0), 0);
  const neighborhoods = new Set(fieldEvents.map((event) => event.neighborhood).filter(Boolean));
  const pendingReview = memoryStats.draftCount + actionPlans.filter((plan) => plan.status !== "completed").length;
  const recentActions = [...fieldEvents].slice(0, 2);
  const openDossiers = actionPlans.filter((plan) => plan.status !== "completed").slice(0, 2);
  const recurringTopics = [
    { name: "ar/poluicao", value: 9 },
    { name: "lixo/residuos", value: 8 },
    { name: "po/sujeira", value: 4 },
    { name: "agua/rio", value: 3 },
    { name: "saude", value: 3 },
    { name: "arvores/sombra", value: 3 },
  ];
  const maxTopic = Math.max(...recurringTopics.map((topic) => topic.value), 1);
  const territoryMap = new Map<string, TerritorySummary>();

  for (const event of fieldEvents) {
    const name = event.neighborhood ?? "Sem territorio";
    const current =
      territoryMap.get(name) ??
      ({
        name,
        status: "Pendente",
        actions: 0,
        topics: new Set<string>(),
        lastListen: null,
      } satisfies TerritorySummary);

    current.actions += 1;
    if (event.topicSlug) current.topics.add(event.topicSlug);
    if (event.status === "done") current.status = "Escutado";
    else if (event.status === "planned" && current.status !== "Escutado") current.status = "Em revisao";
    if (!current.lastListen || (event.startsAt && new Date(event.startsAt) > new Date(current.lastListen))) {
      current.lastListen = event.startsAt ?? event.createdAt;
    }
    territoryMap.set(name, current);
  }

  const territories = Array.from(territoryMap.values()).slice(0, 4);
  const visibleTerritories: TerritorySummary[] =
    territories.length > 0
      ? territories
      : [
          { name: "Banquinha Feira Aterrado", status: "Escutado", actions: 1, topics: new Set(["ar/poluicao", "lixo/residuos"]), lastListen: null },
          { name: "Feira da Vila", status: "Escutado", actions: 1, topics: new Set(["saude"]), lastListen: null },
          { name: "Praca do Pescador", status: "Em revisao", actions: 1, topics: new Set(["agua/rio"]), lastListen: null },
          { name: "Orla do Rio", status: "Pendente", actions: 0, topics: new Set<string>(), lastListen: null },
        ];

  return {
    actionPlans,
    fieldEvents,
    totalInteractions,
    neighborhoods,
    pendingReview,
    recentActions,
    openDossiers,
    recurringTopics,
    maxTopic,
    visibleTerritories,
  };
}

function OperationList({
  title,
  count,
  items,
  empty,
  tone = "green",
}: {
  title: string;
  count: number;
  items: string[];
  empty: string;
  tone?: "green" | "amber" | "orange";
}) {
  const color = tone === "green" ? "text-[#0b5a3f]" : tone === "amber" ? "text-[#a26615]" : "text-[#c25b1b]";

  return (
    <div className="rounded-xl border border-[#e9dece] bg-[#fffdf9] p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className={`text-sm font-black ${color}`}>{title}</h3>
        <Badge variant="secondary" className="rounded-full">
          {count}
        </Badge>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item} className="flex items-center justify-between gap-2 rounded-lg border border-[#eee4d7] bg-white px-3 py-2 text-sm">
              <span className="truncate font-semibold">{item}</span>
              <span className="text-[#607169]">Abrir</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-[#607169]">{empty}</p>
      )}
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[#607169]">{label}</p>
      <p className="mt-1 font-black text-[#0b3326]">{value}</p>
    </div>
  );
}
