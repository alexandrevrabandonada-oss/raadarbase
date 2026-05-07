import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listTopicCategories } from "@/lib/data/topics";
import { listMobilizationReports } from "@/lib/data/reports";
import { FirstRealInstagramReportPanel } from "./first-real-report-panel";
import { NewReportForm } from "./new-report-form";

type FirstRealReportSnapshot = {
  totals?: {
    postsAnalyzed?: number;
    interactionsAnalyzed?: number;
    uniquePeople?: number;
    themesDetected?: number;
    pendingThemes?: number;
  };
};

export const dynamic = "force-dynamic";

export default async function NovoRelatorioPage() {
  await requireInternalPageSession("/relatorios/novo");
  const [topics, reports] = await Promise.all([listTopicCategories(), listMobilizationReports()]);
  const firstRealReport = reports
    .filter((report) => report.title === "Primeiro relatório real do Instagram" && report.status === "generated")
    .sort((left, right) => (left.created_at < right.created_at ? -1 : left.created_at > right.created_at ? 1 : 0))[0] ?? null;

  return (
    <AppShell>
      <PageHeader
        title="Novo Relatório de Mobilização"
        description="Configure os parâmetros para a geração de um novo snapshot de escuta pública."
      />

      <div className="mx-auto max-w-2xl">
        <FirstRealInstagramReportPanel
          existingReport={firstRealReport ? {
            id: firstRealReport.id,
            title: firstRealReport.title,
            snapshot: firstRealReport.snapshot as FirstRealReportSnapshot | null,
          } : null}
        />
        <NewReportForm topics={topics} />
      </div>
    </AppShell>
  );
}
