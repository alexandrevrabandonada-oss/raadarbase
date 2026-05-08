import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader 
        compact
        eyebrow="Modo Operador"
        title="Minha Fila de Trabalho" 
        description="Buscando suas tarefas do dia..." 
      />
      <RadarLoading message="Filtrando sua carga de trabalho..." />
    </AppShell>
  );
}
