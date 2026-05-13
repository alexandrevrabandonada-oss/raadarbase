import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader 
        compact
        eyebrow="Modo Operador"
        title="Minha Fila" 
        description="Montando sua trilha de missões do dia..." 
      />
      <RadarLoading message="Preparando jornada, bem-estar e próximas missões..." />
    </AppShell>
  );
}
