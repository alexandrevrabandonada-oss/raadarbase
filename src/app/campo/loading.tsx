import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RadarLoading } from "@/components/radar/radar-loading";

export default function Loading() {
  return (
    <AppShell>
      <PageHeader
        compact
        eyebrow="Presença Territorial"
        title="Missões de Campo"
        description="Organizando convites, confirmações, presença e follow-up..."
      />
      <RadarLoading variant="field" message="Carregando jornadas de campo..." />
    </AppShell>
  );
}
