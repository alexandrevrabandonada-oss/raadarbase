import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listTopicCategories } from "@/lib/data/topics";
import { listMobilizationReports } from "@/lib/data/reports";
import { NewPlanForm } from "./new-plan-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NovoPlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ reportId?: string }>;
}) {
  await requireInternalPageSession("/acoes/novo");

  const { reportId } = await searchParams;
  const [topics, reports] = await Promise.all([
    listTopicCategories(),
    listMobilizationReports()
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Novo Plano de Ação"
        description="Defina objetivos públicos e tarefas organizativas baseadas em pautas reais."
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive-foreground">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Diretriz de Governança</AlertTitle>
          <AlertDescription className="text-xs">
            Planos de ação organizam respostas públicas e tarefas internas. 
            <strong> Não use para segmentação individual, disparo em massa ou perfilamento político. </strong>
            O uso de termos proibidos bloqueará a criação do plano e gerará um incidente de segurança.
          </AlertDescription>
        </Alert>

        <NewPlanForm 
          topics={topics} 
          reports={reports.filter(r => r.status === 'generated')} 
          initialReportId={reportId}
        />
      </div>
    </AppShell>
  );
}
