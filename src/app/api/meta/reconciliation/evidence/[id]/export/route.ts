import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getMetaReconciliationEvidence } from "@/lib/data/meta-reconciliation-evidence";
import { requireInternalSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function buildMarkdownContent(evidence: Awaited<ReturnType<typeof getMetaReconciliationEvidence>>) {
  if (!evidence) return null;

  return [
    "# Evidência Operacional Meta",
    "",
    `**Data/hora:** ${new Date(evidence.generated_at).toLocaleString("pt-BR")}`,
    `**Status:** ${evidence.status}`,
    `**Hash do relatório:** ${evidence.report_hash}`,
    "",
    "## Contagens agregadas",
    `- Posts: ${evidence.posts_count}`,
    `- Interações/comentários: ${evidence.interactions_count}`,
    `- Pessoas: ${evidence.people_count}`,
    `- Runs Meta: ${evidence.meta_sync_runs_count}`,
    `- Audit logs Meta: ${evidence.meta_audit_logs_count}`,
    `- Runs iniciadas: ${evidence.started_runs_count}`,
    `- Runs presas: ${evidence.stuck_runs_count}`,
    "",
    "## Notas operacionais",
    evidence.notes ?? "Sem notas operacionais.",
    "",
    "---",
    "Evidência operacional agregada. Não contém dados pessoais, comentários, payload bruto ou tokens.",
  ].join("\n");
}

function buildHtmlContent(evidence: Awaited<ReturnType<typeof getMetaReconciliationEvidence>>) {
  if (!evidence) return null;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Evidência Operacional Meta</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
        h1 { border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
        h2 { margin-top: 28px; }
        .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; background: #fff; }
        .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
        .value { font-size: 18px; font-weight: 700; margin-top: 6px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        @media print { body { margin: 0; max-width: none; } }
      </style>
    </head>
    <body>
      <h1>Evidência Operacional Meta</h1>
      <div class="meta">
        <div><strong>Data/hora:</strong> ${new Date(evidence.generated_at).toLocaleString("pt-BR")}</div>
        <div><strong>Status:</strong> ${evidence.status}</div>
        <div><strong>Hash do relatório:</strong> ${evidence.report_hash}</div>
      </div>
      <div class="grid">
        <div class="item"><div class="label">Posts</div><div class="value">${evidence.posts_count}</div></div>
        <div class="item"><div class="label">Interações/comentários</div><div class="value">${evidence.interactions_count}</div></div>
        <div class="item"><div class="label">Pessoas</div><div class="value">${evidence.people_count}</div></div>
        <div class="item"><div class="label">Runs Meta</div><div class="value">${evidence.meta_sync_runs_count}</div></div>
        <div class="item"><div class="label">Audit logs Meta</div><div class="value">${evidence.meta_audit_logs_count}</div></div>
        <div class="item"><div class="label">Runs iniciadas</div><div class="value">${evidence.started_runs_count}</div></div>
        <div class="item"><div class="label">Runs presas</div><div class="value">${evidence.stuck_runs_count}</div></div>
      </div>
      <h2>Notas operacionais</h2>
      <p>${(evidence.notes ?? "Sem notas operacionais.").replace(/\n/g, "<br>")}</p>
      <div class="footer">Evidência operacional agregada. Não contém dados pessoais, comentários, payload bruto ou tokens.</div>
    </body>
    </html>
  `;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireInternalSession();
    const { id } = await params;
    const evidence = await getMetaReconciliationEvidence(id);

    if (!evidence) return new NextResponse("Not Found", { status: 404 });

    const format = req.nextUrl.searchParams.get("format") === "html" ? "html" : "markdown";

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "meta.reconciliation_evidence_exported",
      entityType: "meta_reconciliation_evidence",
      entityId: id,
      summary: `Evidência operacional exportada em ${format}.`,
      metadata: {
        status: evidence.status,
        report_hash: evidence.report_hash,
        format,
      },
    });

    if (format === "html") {
      return new NextResponse(buildHtmlContent(evidence), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new NextResponse(buildMarkdownContent(evidence), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="evidencia-meta-${id}.md"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro na exportação." }, { status: 500 });
  }
}
