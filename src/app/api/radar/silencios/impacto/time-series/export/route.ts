import { NextResponse } from "next/server";
import { getSilenceImpactTimeSeries } from "@/lib/data/silence-radar-time-series";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireInternalSession();
    await requireRole(["admin", "operador"]);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";
    const kind = searchParams.get("kind") ?? "all";
    const targetType = searchParams.get("targetType") ?? "all";
    const status = searchParams.get("status") ?? "all";
    const from = searchParams.get("from") ?? null;
    const to = searchParams.get("to") ?? null;
    const territorialWindowScope = searchParams.get("territorialWindowScope") ?? "all";
    const territorialWindowId = searchParams.get("territorialWindowId") ?? null;

    const timeSeries = await getSilenceImpactTimeSeries({
      kind,
      targetType,
      status,
      from,
      to,
      territorialWindowScope,
      territorialWindowId,
    });

    const points = timeSeries.points;

    if (format === "markdown") {
      let md = `# Exportação de Série Temporal Agregada - Radar de Silêncios\n\n`;
      md += `*Data da exportação: ${new Date().toISOString()}*\n\n`;
      md += `> **Nota de privacidade**: Este relatório contém apenas métricas agregadas por dia. Não há dados PII, nomes, usernames ou textos brutos.\n\n`;
      
      md += `## Resumo de Tendência\n`;
      md += `- Tendência detectada: **${timeSeries.trend.toUpperCase()}**\n`;
      md += `- Alvo filtrado: ${timeSeries.targetType}\n\n`;

      md += `## Série Diária\n\n`;
      md += `| Data | Relatos | Formulários | Interações | Ação Criada |\n`;
      md += `|---|---|---|---|---|\n`;

      for (const p of points) {
        md += `| ${p.date} | ${p.reportCount} | ${p.formCount} | ${p.interactionCount} | ${p.actionCreatedAt ? "Sim" : "Não"} |\n`;
      }

      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": 'attachment; filename="radar_silencios_time_series_export.md"',
        },
      });
    }

    // Default to CSV
    const rows = [
      ["data", "relatos", "formularios", "interacoes", "acao_criada_na_data"],
      ...points.map((p) => [
        p.date,
        String(p.reportCount),
        String(p.formCount),
        String(p.interactionCount),
        p.actionCreatedAt ? "sim" : "nao",
      ]),
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="radar_silencios_time_series_export.csv"',
      },
    });
  } catch (error) {
    console.error("[time_series_export] Error:", error);
    return NextResponse.json({ error: "Falha ao exportar série temporal" }, { status: 500 });
  }
}
