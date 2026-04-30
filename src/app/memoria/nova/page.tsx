import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listTopicCategories } from "@/lib/data/topics";
import { MemoryForm } from "./memory-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NovaMemoriaPage() {
  await requireInternalPageSession("/memoria/nova");
  const topics = await listTopicCategories();

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/memoria" />}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Memória
          </Button>
        </div>

        <PageHeader
          title="Nova Memória Estratégica"
          description="Registre um aprendizado consolidado para a organização."
        />

        <div className="mt-8">
          <MemoryForm topics={topics} />
        </div>
      </div>
    </AppShell>
  );
}
