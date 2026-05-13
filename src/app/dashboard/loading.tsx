import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader 
        eyebrow="Painel de Controle"
        title="Base de Operações"
        description="Sincronizando missão do dia, ritmo e mobilização territorial..."
      />
      <RadarLoading variant="base" message="Sincronizando central de comando..." />
    </AppShell>
  );
}
