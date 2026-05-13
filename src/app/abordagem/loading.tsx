import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader
        compact
        eyebrow="Jornada Operacional"
        title="Mural de Missões"
        description="Organizando o fluxo cooperativo das missões..."
      />
      <RadarLoading message="Distribuindo etapas entre preparar, conversar, registrar, encaminhar e concluir..." />
    </AppShell>
  );
}
