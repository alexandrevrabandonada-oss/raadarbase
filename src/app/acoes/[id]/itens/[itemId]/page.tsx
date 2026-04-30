/* eslint-disable @typescript-eslint/no-explicit-any */
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getActionPlanItem } from "@/lib/data/action-plans";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  User, 
  Tag, 
  FileText, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EvidenceList } from "./evidence-list";
import { ExecutionForms } from "./execution-forms";

export const dynamic = "force-dynamic";

export default async function ItemDetalhePage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  await requireInternalPageSession("/acoes/[id]/itens/[itemId]");
  const { id, itemId } = await params;

  const itemData = await getActionPlanItem(itemId);
  if (!itemData || itemData.action_plan_id !== id) notFound();
  const item = itemData as any; // Cast once to bypass multiple any errors

  return (
    <AppShell>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/acoes/${id}`} />}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Plano
        </Button>
      </div>

      <PageHeader
        title={item.title}
        description={`Item do plano: ${ item.plan.title }`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sobre a Tarefa</CardTitle>
              <Badge variant={item.status === 'done' ? 'default' : 'secondary'}>
                {item.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.description}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Tag className="h-4 w-4 mr-2" />
                  Tipo: <span className="font-semibold text-foreground ml-1 uppercase text-[10px]">{item.type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Tag className="h-4 w-4 mr-2" />
                  Tema: <span className="font-semibold text-foreground ml-1">{item.plan.topic?.name || "Sem tema"}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  Responsável: <span className="font-semibold text-foreground ml-1">{item.assigned_to_email || "Não atribuído"}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  Prazo: <span className="font-semibold text-foreground ml-1">{item.due_date || "Sem prazo"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Evidências de Execução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EvidenceList 
                planId={id}
                itemId={itemId} 
                initialEvidence={item.evidence} 
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={item.status === 'done' ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                Resultado e Aprendizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExecutionForms 
                planId={id}
                itemId={itemId}
                initialResult={item.result}
                itemStatus={item.status}
              />
            </CardContent>
          </Card>

          <div className="p-4 bg-amber-100 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <strong>Aviso de Governança:</strong>
              <p className="mt-1">
                Registre apenas evidências necessárias para prestação de contas da ação. 
                <strong> Não inclua dados pessoais sem consentimento. </strong>
                Toda alteração é auditada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
