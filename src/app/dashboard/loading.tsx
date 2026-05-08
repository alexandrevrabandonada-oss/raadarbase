import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader 
        eyebrow="Painel de Controle"
        title="Hoje no Radar"
        description="Carregando dados operacionais e interações recentes..."
      />
      <RadarLoading message="Sincronizando central de comando..." />
    </AppShell>
  );
}
