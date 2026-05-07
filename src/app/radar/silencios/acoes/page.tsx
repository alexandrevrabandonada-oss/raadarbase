import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { listSilenceRadarCorrectiveActions } from "@/lib/data/silence-radar-corrective-actions";
import type { CorrectiveActionRow } from "@/lib/data/silence-radar-corrective-actions";
import {
  completeCorrectiveActionServerAction,
  archiveCorrectiveActionServerAction,
} from "./actions";
import { CheckCircle2, Archive, ArrowLeft, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  reforco_bairro: "Reforço de escuta",
  explicacao_pauta: "Explicação de pauta",
  pergunta_publica: "Pergunta pública",
  roda_escuta: "Roda de escuta",
  card_explicativo: "Card explicativo",
};

const TARGET_LABELS: Record<string, string> = {
  bairro: "Bairro",
  pauta: "Pauta",
  post: "Post",
  janela: "Janela",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-amber-100 text-amber-800 border-amber-200",
  doing: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planejada",
  doing: "Em andamento",
  done: "Concluída",
  archived: "Arquivada",
};

function BaselineInfo({ action }: { action: CorrectiveActionRow }) {
  if (action.baseline_value !== null) {
    return (
      <p className="text-xs text-muted-foreground">
        Baseline: <span className="font-medium">{action.baseline_value}</span> ·{" "}
        <span className="text-slate-400">{action.source_metric}</span>
      </p>
    );
  }
  return (
    <p className="text-xs text-muted-foreground">
      Métrica: <span className="text-slate-400">{action.source_metric}</span>
    </p>
  );
}

export default async function CorrectiveActionsPage() {
  await requireInternalPageSession("/radar/silencios/acoes");
  await requireRole(["admin", "operador"]);

  const actions = await listSilenceRadarCorrectiveActions();

  const grouped = {
    planned: actions.filter((a) => a.status === "planned"),
    doing: actions.filter((a) => a.status === "doing"),
    done: actions.filter((a) => a.status === "done"),
    archived: actions.filter((a) => a.status === "archived"),
  };

  const activeCount = grouped.planned.length + grouped.doing.length;
  const doneCount = grouped.done.length;

  return (
    <AppShell>
      <PageHeader
        title="Ações Corretivas do Radar de Silêncios"
        description="Acompanhe as ações geradas a partir dos achados do Radar de Silêncios. Toda análise é agregada — sem score individual, sem PII."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button nativeButton={false} variant="outline" render={<Link href="/radar/silencios" />}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar ao Radar
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/radar/silencios/impacto" />}>
          Ver impacto agregado
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/api/radar/silencios/acoes/export" />}>
          Exportar CSV seguro
        </Button>
        <div className="ml-auto flex gap-2">
          <Badge variant="outline">{activeCount} ativa{activeCount !== 1 ? "s" : ""}</Badge>
          <Badge variant="outline" className="border-green-300 text-green-700">{doneCount} concluída{doneCount !== 1 ? "s" : ""}</Badge>
        </div>
      </div>

      {actions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma ação corretiva criada ainda.</p>
            <p className="text-xs text-muted-foreground">
              Acesse o{" "}
              <Link href="/radar/silencios" className="underline">
                Radar de Silêncios
              </Link>{" "}
              para criar ações a partir dos achados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {(["planned", "doing", "done", "archived"] as const).map((status) => {
            const items = grouped[status];
            if (items.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="mb-3 text-sm font-semibold text-slate-700">
                  {STATUS_LABELS[status]}{" "}
                  <span className="font-normal text-muted-foreground">({items.length})</span>
                </h2>
                <div className="space-y-3">
                  {items.map((action) => (
                    <Card key={action.id} className="border-slate-200">
                      <CardHeader className="pb-2 pt-4">
                        <div className="flex flex-wrap items-start gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_COLORS[action.status]}`}
                          >
                            {STATUS_LABELS[action.status]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {KIND_LABELS[action.kind] ?? action.kind}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {TARGET_LABELS[action.target_type] ?? action.target_type}
                          </Badge>
                          <CardTitle className="w-full text-sm font-medium">
                            <Link href={`/radar/silencios/acoes/${action.id}`} className="underline">
                              {action.target_label}
                            </Link>
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="space-y-1">
                          <BaselineInfo action={action} />
                          <p className="text-xs text-muted-foreground">
                            Criada em{" "}
                            {new Date(action.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                          {action.completed_at && (
                            <p className="text-xs text-green-700">
                              Concluída em{" "}
                              {new Date(action.completed_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          )}
                          {action.action_plan_item_id && (
                            <p className="text-xs text-muted-foreground">
                              Item do plano:{" "}
                              <Link href="/acoes" className="underline">
                                ver planos
                              </Link>
                            </p>
                          )}
                        </div>

                        {action.status !== "done" && action.status !== "archived" && (
                          <div className="mt-3 flex gap-2">
                            <form action={completeCorrectiveActionServerAction}>
                              <input type="hidden" name="id" value={action.id} />
                              <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 px-2 text-xs text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Concluir
                              </Button>
                            </form>
                            <form action={archiveCorrectiveActionServerAction}>
                              <input type="hidden" name="id" value={action.id} />
                              <Button
                                type="submit"
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 px-2 text-xs text-slate-500"
                              >
                                <Archive className="h-3 w-3" />
                                Arquivar
                              </Button>
                            </form>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Governance notice */}
      <div className="mt-8 rounded-md border border-slate-200 bg-slate-50/50 p-4">
        <p className="text-xs font-medium text-slate-700">Guardrails preservados</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "Sem score individual",
            "Sem classificação de pessoa",
            "Sem DM automática",
            "Sem microtargeting",
            "Apenas agregados",
            "Sem PII",
          ].map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">
              {g}
            </Badge>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
