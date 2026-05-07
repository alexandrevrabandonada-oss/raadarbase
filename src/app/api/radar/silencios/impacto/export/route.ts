import { NextRequest, NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getSilenceRadarImpactDashboard } from "@/lib/data/silence-radar-impact";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  reforco_bairro: "Reforço por bairro",
  explicacao_pauta: "Explicação de pauta",
  pergunta_publica: "Pergunta pública",
  roda_escuta: "Roda de escuta",
  card_explicativo: "Card explicativo",
};

const IMPACT_LABELS: Record<string, string> = {
  melhoria: "melhoria",
  estavel: "estável",
  atencao: "atenção",
  sem_dados_suficientes: "sem dados suficientes",
};

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toMarkdownTable(rows: Awaited<ReturnType<typeof getSilenceRadarImpactDashboard>>["rows"]) {
  const header = "| tipo | alvo | baseline | valor_atual | delta | status_impacto | periodo |\n|---|---|---:|---:|---:|---|---|";
  const lines = rows.map((row) => {
    const period = `${new Date(row.createdAt).toLocaleDateString("pt-BR")} - ${row.completedAt ? new Date(row.completedAt).toLocaleDateString("pt-BR") : "em andamento"}`;
    return `| ${KIND_LABELS[row.kind] ?? row.kind} | ${row.targetLabel} (${row.targetType}) | ${row.baselineValue ?? "-"} | ${row.currentValue ?? "-"} | ${row.deltaAbsolute ?? "-"} | ${IMPACT_LABELS[row.impactStatus] ?? row.impactStatus} | ${period} |`;
  });
  return [header, ...lines].join("\n");
}

export async function GET(req: NextRequest) {
  const user = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  const format = req.nextUrl.searchParams.get("format") === "markdown" ? "markdown" : "csv";

  const dashboard = await getSilenceRadarImpactDashboard();

  const csvHeaders = ["tipo", "alvo", "baseline", "valor_atual", "delta", "status_impacto", "periodo"];
  const csvRows = dashboard.rows.map((row) => {
    const period = `${new Date(row.createdAt).toLocaleDateString("pt-BR")} - ${row.completedAt ? new Date(row.completedAt).toLocaleDateString("pt-BR") : "em_andamento"}`;
    return [
      escapeCsv(KIND_LABELS[row.kind] ?? row.kind),
      escapeCsv(`${row.targetLabel} (${row.targetType})`),
      escapeCsv(row.baselineValue),
      escapeCsv(row.currentValue),
      escapeCsv(row.deltaAbsolute),
      escapeCsv(IMPACT_LABELS[row.impactStatus] ?? row.impactStatus),
      escapeCsv(period),
    ];
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "silence_radar.impact_exported",
    entityType: "silence_radar_corrective_actions",
    entityId: null,
    summary: `Exportação segura de impacto agregado do Radar de Silêncios (${dashboard.rows.length} linhas, formato ${format}).`,
    metadata: { format, rows: dashboard.rows.length, pii: false },
  });

  if (format === "markdown") {
    return new NextResponse(toMarkdownTable(dashboard.rows), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="silence-radar-impacto-${new Date().toISOString().slice(0, 10)}.md"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="silence-radar-impacto-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
