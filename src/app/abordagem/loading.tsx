import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader
        compact
        eyebrow="Fila de Abordagem"
        title="Quadro de Vínculos"
        description="Carregando tarefas e progresso dos contatos..."
      />
      <RadarLoading message="Preparando quadro Kanban..." />
    </AppShell>
  );
}
