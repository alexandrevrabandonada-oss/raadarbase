import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader
        compact
        eyebrow="Base Territorial"
        title="Mapa da Mobilização"
        description="Lendo bairros, fases e sinais agregados do território..."
      />
      <RadarLoading variant="territory" message="Montando o mapa da mobilização..." />
    </AppShell>
  );
}
