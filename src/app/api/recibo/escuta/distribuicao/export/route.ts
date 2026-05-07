/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { getReceiptDistributionImpact } from "@/lib/data/public-receipt-distribution-impact";
import { listReceiptDistributionCycles } from "@/lib/data/public-receipt-distribution";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession();
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    if (!cycleId) {
      return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
    }

    const cycles = await listReceiptDistributionCycles();
    const cycle = cycles.find(c => c.id === cycleId);
    
    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    const impact = await getReceiptDistributionImpact(cycleId);

    const report = `# Relatório de Impacto de Distribuição
Ciclo: ${cycle.title}
Status: ${cycle.status.toUpperCase()}
Início: ${cycle.starts_at || "N/A"}
Fim: ${cycle.ends_at || "Ainda ativo"}

## Resultados Agregados (Antes vs Depois)
- Relatos: ${impact.before.reportCount} -> ${impact.after.reportCount} (Delta: ${impact.delta.reportCount})
- Bairros: ${impact.before.neighborhoodCount} -> ${impact.after.neighborhoodCount} (Delta: ${impact.delta.neighborhoodCount})
- Pautas: ${impact.before.pautaCount} -> ${impact.after.pautaCount} (Delta: ${impact.delta.pautaCount})

Status Final de Impacto: ${impact.status.toUpperCase()}

---
Este relatório contém apenas dados agregados e anonimizados.
Gerado por: ${session.email} em ${new Date().toLocaleString("pt-BR")}
`;

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "report.exported",
      entityType: "public_receipt_distribution_cycles",
      entityId: cycleId,
      summary: `Exportado relatório de impacto do ciclo de distribuição: ${cycle.title}`,
      metadata: { cycle_id: cycleId },
    });

    return new Response(report, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="impacto-distribuicao-${cycleId}.md"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
