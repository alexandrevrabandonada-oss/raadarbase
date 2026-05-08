import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader 
        compact
        eyebrow="Priorização Diária"
        title="Prioridades da Equipe"
        description="Buscando engajamento recente e chance de virar ação concreta..."
      />
      <RadarLoading message="Calculando prioridades da base..." />
    </AppShell>
  );
}
