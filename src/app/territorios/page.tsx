import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { listFieldAgendaEvents } from "@/lib/data/field-agenda";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { MapPin, MessageSquareText, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TerritoriosPage() {
  await requireInternalPageSession("/territorios");
  const events = await listFieldAgendaEvents().catch(() => []);
  const neighborhoods = new Set(events.map((event) => event.neighborhood).filter(Boolean));
  const done = events.filter((event) => event.status === "done").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Territorios"
        title="Leitura territorial por bairros e pautas."
        description="Resumo operacional construido a partir das acoes de campo e escutas existentes."
        actions={<Button nativeButton={false} render={<Link href="/mapa" />}>Abrir mapa-lista</Button>}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<MapPin className="h-5 w-5" />} label="Territorios registrados" value={neighborhoods.size} />
        <MetricCard icon={<ClipboardList className="h-5 w-5" />} label="Acoes territoriais" value={events.length} />
        <MetricCard icon={<MessageSquareText className="h-5 w-5" />} label="Escutas concluidas" value={done} />
      </section>
    </AppShell>
  );
}
