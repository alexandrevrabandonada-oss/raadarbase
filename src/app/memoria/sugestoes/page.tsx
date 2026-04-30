import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { MemorySuggestions } from "./memory-suggestions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SugestoesMemoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string }>;
}) {
  await requireInternalPageSession("/memoria/sugestoes");
  const { tema } = await searchParams;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/memoria" />}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Memória
          </Button>
        </div>

        <PageHeader
          title="Sugestões de Memória"
          description="Sintetizamos padrões a partir das lições aprendidas registradas nas execuções de tarefas."
        />

        <div className="mt-8">
          <MemorySuggestions initialTopicId={tema} />
        </div>
      </div>
    </AppShell>
  );
}
