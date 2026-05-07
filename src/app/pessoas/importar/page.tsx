import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { ImportClient } from "./import-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImportarPage() {
  await requireInternalPageSession("/pessoas/importar");

  return (
    <AppShell>
      <PageHeader
        title="Importar Pessoas"
        description="Carregue contatos observados manualmente no Instagram para acompanhamento da equipe."
      />

      <Alert className="border-amber-200 bg-amber-50/60 mb-6">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Diretrizes de Privacidade e Segurança</AlertTitle>
        <AlertDescription className="text-amber-700">
          Esta ferramenta destina-se <strong>exclusivamente</strong> à gestão de contatos públicos ou daqueles que já interagiram com a base.
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Não faça scraping</strong> nem importe bases compradas.</li>
            <li><strong>Não importe dados sensíveis</strong> (religião, saúde, orientação sexual, etc).</li>
            <li>Pessoas que pediram privacidade (&quot;Não Abordar&quot;) terão sua vontade respeitada automaticamente caso já existam no banco.</li>
          </ul>
        </AlertDescription>
      </Alert>

      <ImportClient />
    </AppShell>
  );
}
