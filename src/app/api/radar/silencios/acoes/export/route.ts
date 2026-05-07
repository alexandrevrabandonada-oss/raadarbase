import { NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { listSilenceRadarCorrectiveActions } from "@/lib/data/silence-radar-corrective-actions";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  reforco_bairro: "Reforço de escuta",
  explicacao_pauta: "Explicação de pauta",
  pergunta_publica: "Pergunta pública",
  roda_escuta: "Roda de escuta",
  card_explicativo: "Card explicativo",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planejada",
  doing: "Em andamento",
  done: "Concluída",
  archived: "Arquivada",
};

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const user = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  const actions = await listSilenceRadarCorrectiveActions();

  const headers = [
    "tipo_acao",
    "alvo_tipo",
    "alvo",
    "metrica_origem",
    "baseline",
    "status",
    "data_criacao",
    "data_conclusao",
    "item_plano_vinculado",
  ];

  const rows = actions.map((action) => [
    escapeCsv(KIND_LABELS[action.kind] ?? action.kind),
    escapeCsv(action.target_type),
    escapeCsv(action.target_label),
    escapeCsv(action.source_metric),
    escapeCsv(action.baseline_value),
    escapeCsv(STATUS_LABELS[action.status] ?? action.status),
    escapeCsv(new Date(action.created_at).toLocaleDateString("pt-BR")),
    escapeCsv(action.completed_at
      ? new Date(action.completed_at).toLocaleDateString("pt-BR")
      : ""),
    escapeCsv(action.action_plan_item_id ? "sim" : "não"),
  ]);

  const csvLines = [headers.join(","), ...rows.map((r) => r.join(","))];
  const csv = csvLines.join("\r\n");

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "territorial.snapshot_exported",
    entityType: "silence_radar_corrective_actions",
    entityId: null,
    summary: `Exportação segura de ${actions.length} ações corretivas do Radar de Silêncios (sem PII).`,
    metadata: { count: actions.length, export_format: "csv" },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="silence-radar-acoes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
