import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AjudaPage() {
  await requireInternalPageSession("/ajuda");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Ajuda"
        title="Como usar o SEMEAR Territorios."
        description="Guia rapido para a equipe operar com clareza, cuidado e sem expor dados sensiveis."
      />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {[
          ["Leia o territorio", "Use indicadores agregados para orientar conversa coletiva, nao para perfilar pessoas."],
          ["Registre o necessario", "Anote apenas o que ajuda a cuidar da relacao e da devolutiva publica."],
          ["Publique com seguranca", "Snapshots e relatorios devem sair sem dados brutos, contatos ou informacoes sensiveis."],
          ["Uso no celular", "Use “Digitar” para fichas, selecione acao e entrevistador antes, salve como rascunho e revise depois com calma. Nao registre CPF, telefone ou endereco. Para relatorios grandes, prefira desktop."],
        ].map(([title, text]) => (
          <Card key={title} className="rounded-2xl border-[#e2d7c4]">
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
