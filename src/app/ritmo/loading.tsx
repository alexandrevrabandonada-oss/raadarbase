import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader
        compact
        eyebrow="Leitura da Operação"
        title="Central de Ritmo"
        description="Conferindo travas, carga da base e fechamento do ciclo..."
      />
      <RadarLoading variant="rhythm" message="Montando a central de ritmo..." />
    </AppShell>
  );
}
