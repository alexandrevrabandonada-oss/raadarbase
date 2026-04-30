import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listTopicCategories } from "@/lib/data/topics";
import { NewReportForm } from "./new-report-form";

export const dynamic = "force-dynamic";

export default async function NovoRelatorioPage() {
  await requireInternalPageSession("/relatorios/novo");
  const topics = await listTopicCategories();

  return (
    <AppShell>
      <PageHeader
        title="Novo Relatório de Mobilização"
        description="Configure os parâmetros para a geração de um novo snapshot de escuta pública."
      />

      <div className="mx-auto max-w-2xl">
        <NewReportForm topics={topics} />
      </div>
    </AppShell>
  );
}
