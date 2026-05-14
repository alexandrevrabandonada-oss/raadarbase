import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listTopicCategories } from "@/lib/data/topics";
import { MemoryForm } from "./memory-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { countStrategicMemoryLinksByEntity } from "@/lib/data/strategic-memory";
import { getFieldAgendaEvent, getFieldAgendaEventResult } from "@/lib/data/field-agenda";
import { buildFieldResultMemoryDraft } from "@/lib/field-memory/assisted-memory";

export const dynamic = "force-dynamic";

export default async function NovaMemoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; eventId?: string; resultId?: string }>;
}) {
  await requireInternalPageSession("/memoria/nova");
  const params = await searchParams;
  const topics = await listTopicCategories();

  let assistedDraft = null;
  if (params.source === "result" && params.eventId && params.resultId) {
    const [event, result] = await Promise.all([
      getFieldAgendaEvent(params.eventId),
      getFieldAgendaEventResult(params.eventId),
    ]);

    if (event && result && result.id === params.resultId) {
      const linkCounts = await countStrategicMemoryLinksByEntity("result", [result.id]);
      if ((linkCounts[result.id] ?? 0) === 0) {
        assistedDraft = buildFieldResultMemoryDraft({ event, result, topics });
      }
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/memoria" />}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Memória
          </Button>
        </div>

        <PageHeader
          title={assistedDraft ? "Criar memória deste resultado" : "Nova Memória Estratégica"}
          description={
            assistedDraft
              ? "Revise a síntese, confirme os cuidados éticos e salve a memória só depois da revisão humana."
              : "Registre um aprendizado consolidado para a organização."
          }
        />

        <div className="mt-8">
          <MemoryForm topics={topics} assistedDraft={assistedDraft} />
        </div>
      </div>
    </AppShell>
  );
}
