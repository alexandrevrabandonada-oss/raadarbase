import { NextRequest, NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getTerritorialSnapshot } from "@/lib/data/territorial-listening-monitoring";

export const dynamic = "force-dynamic";

function getNumberMetadata(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" ? value : 0;
}

function getStringMetadata(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function buildMarkdown(snapshot: Awaited<ReturnType<typeof getTerritorialSnapshot>>) {
  if (!snapshot) return null;

  const outreachSharedCount = getNumberMetadata(snapshot.metadata, "outreach_shared_count");
  const conversionStatus = getStringMetadata(snapshot.metadata, "conversion_status") ?? "no_shared_yet";
  const reportsBeforeFirstShared = getNumberMetadata(snapshot.metadata, "reports_before_first_shared");
  const reportsAfterFirstShared = getNumberMetadata(snapshot.metadata, "reports_after_first_shared");
  const conversionDifferenceAbsolute = getNumberMetadata(snapshot.metadata, "conversion_difference_absolute");
  const newBatchSharedCount = getNumberMetadata(snapshot.metadata, "new_batch_shared_count");
  const firstNewBatchSharedAt = getStringMetadata(snapshot.metadata, "first_new_batch_shared_at") ?? "-";
  const newBatchConversionStatus = getStringMetadata(snapshot.metadata, "new_batch_conversion_status") ?? "no_shared_yet";
  const reportsBeforeFirstNewBatchShared = getNumberMetadata(snapshot.metadata, "reports_before_first_new_batch_shared");
  const reportsAfterFirstNewBatchShared = getNumberMetadata(snapshot.metadata, "reports_after_first_new_batch_shared");
  const newBatchConversionDifferenceAbsolute = getNumberMetadata(snapshot.metadata, "new_batch_conversion_difference_absolute");

  return [
    "# Snapshot territorial agregado",
    "",
    `**Data do snapshot:** ${snapshot.snapshotDate}`,
    `**Gerado em:** ${new Date(snapshot.generatedAt).toLocaleString("pt-BR")}`,
    `**Status:** ${snapshot.status}`,
    `**Notas operacionais:** ${snapshot.notes ?? "Sem notas operacionais."}`,
    "",
    "## Contagens agregadas",
    `- Total de relatos: ${snapshot.totalReports}`,
    `- Com consentimento: ${snapshot.totalWithContactConsent}`,
    `- Sem consentimento: ${snapshot.totalWithoutContactConsent}`,
    `- Bairros citados: ${snapshot.neighborhoodsCount}`,
    `- Pautas citadas: ${snapshot.topicsCount}`,
    `- Pendentes de revisão: ${snapshot.pendingReviewCount}`,
    `- Revisados: ${snapshot.reviewedCount}`,
    `- Encaminhados: ${snapshot.forwardedCount}`,
    `- Arquivados: ${snapshot.archivedCount}`,
    `- Reforços compartilhados: ${outreachSharedCount}`,
    `- Conversão (status): ${conversionStatus}`,
    `- Relatos antes do 1º shared: ${reportsBeforeFirstShared}`,
    `- Relatos após o 1º shared: ${reportsAfterFirstShared}`,
    `- Diferença absoluta (antes x depois): ${conversionDifferenceAbsolute}`,
    `- Shared do novo lote: ${newBatchSharedCount}`,
    `- 1º shared do novo lote: ${firstNewBatchSharedAt}`,
    `- Conversão do novo lote (status): ${newBatchConversionStatus}`,
    `- Relatos antes do 1º shared do novo lote: ${reportsBeforeFirstNewBatchShared}`,
    `- Relatos após o 1º shared do novo lote: ${reportsAfterFirstNewBatchShared}`,
    `- Diferença absoluta do novo lote: ${newBatchConversionDifferenceAbsolute}`,
    "",
    "## Top bairros",
    ...(snapshot.topNeighborhoods.length > 0 ? snapshot.topNeighborhoods.map((item) => `- ${item.bairro}: ${item.quantidade}`) : ["- Sem bairros registrados."]),
    "",
    "## Top pautas",
    ...(snapshot.topTopics.length > 0 ? snapshot.topTopics.map((item) => `- ${item.pauta}: ${item.quantidade}`) : ["- Sem pautas registradas."]),
    "",
    "---",
    "Snapshot territorial agregado. Não contém dados pessoais nem relatos brutos.",
  ].join("\n");
}

function buildHtml(snapshot: Awaited<ReturnType<typeof getTerritorialSnapshot>>) {
  if (!snapshot) return null;

  const outreachSharedCount = getNumberMetadata(snapshot.metadata, "outreach_shared_count");
  const conversionStatus = getStringMetadata(snapshot.metadata, "conversion_status") ?? "no_shared_yet";
  const reportsBeforeFirstShared = getNumberMetadata(snapshot.metadata, "reports_before_first_shared");
  const reportsAfterFirstShared = getNumberMetadata(snapshot.metadata, "reports_after_first_shared");
  const conversionDifferenceAbsolute = getNumberMetadata(snapshot.metadata, "conversion_difference_absolute");
  const newBatchSharedCount = getNumberMetadata(snapshot.metadata, "new_batch_shared_count");
  const firstNewBatchSharedAt = getStringMetadata(snapshot.metadata, "first_new_batch_shared_at") ?? "-";
  const newBatchConversionStatus = getStringMetadata(snapshot.metadata, "new_batch_conversion_status") ?? "no_shared_yet";
  const reportsBeforeFirstNewBatchShared = getNumberMetadata(snapshot.metadata, "reports_before_first_new_batch_shared");
  const reportsAfterFirstNewBatchShared = getNumberMetadata(snapshot.metadata, "reports_after_first_new_batch_shared");
  const newBatchConversionDifferenceAbsolute = getNumberMetadata(snapshot.metadata, "new_batch_conversion_difference_absolute");

  const list = (items: string[]) => items.map((item) => `<li>${item}</li>`).join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Snapshot territorial agregado</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
        h1 { border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
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
      <h1>Snapshot territorial agregado</h1>
      <div class="meta">
        <div><strong>Data do snapshot:</strong> ${snapshot.snapshotDate}</div>
        <div><strong>Gerado em:</strong> ${new Date(snapshot.generatedAt).toLocaleString("pt-BR")}</div>
        <div><strong>Status:</strong> ${snapshot.status}</div>
        <div><strong>Notas operacionais:</strong> ${snapshot.notes ?? "Sem notas operacionais."}</div>
      </div>
      <div class="grid">
        <div class="item"><div class="label">Total de relatos</div><div class="value">${snapshot.totalReports}</div></div>
        <div class="item"><div class="label">Com consentimento</div><div class="value">${snapshot.totalWithContactConsent}</div></div>
        <div class="item"><div class="label">Sem consentimento</div><div class="value">${snapshot.totalWithoutContactConsent}</div></div>
        <div class="item"><div class="label">Bairros citados</div><div class="value">${snapshot.neighborhoodsCount}</div></div>
        <div class="item"><div class="label">Pautas citadas</div><div class="value">${snapshot.topicsCount}</div></div>
        <div class="item"><div class="label">Pendentes de revisão</div><div class="value">${snapshot.pendingReviewCount}</div></div>
        <div class="item"><div class="label">Revisados</div><div class="value">${snapshot.reviewedCount}</div></div>
        <div class="item"><div class="label">Encaminhados</div><div class="value">${snapshot.forwardedCount}</div></div>
        <div class="item"><div class="label">Arquivados</div><div class="value">${snapshot.archivedCount}</div></div>
        <div class="item"><div class="label">Reforços compartilhados</div><div class="value">${outreachSharedCount}</div></div>
        <div class="item"><div class="label">Conversão (status)</div><div class="value">${conversionStatus}</div></div>
        <div class="item"><div class="label">Relatos antes do 1º shared</div><div class="value">${reportsBeforeFirstShared}</div></div>
        <div class="item"><div class="label">Relatos após o 1º shared</div><div class="value">${reportsAfterFirstShared}</div></div>
        <div class="item"><div class="label">Diferença absoluta</div><div class="value">${conversionDifferenceAbsolute}</div></div>
        <div class="item"><div class="label">Shared do novo lote</div><div class="value">${newBatchSharedCount}</div></div>
        <div class="item"><div class="label">1º shared novo lote</div><div class="value">${firstNewBatchSharedAt}</div></div>
        <div class="item"><div class="label">Conversão novo lote</div><div class="value">${newBatchConversionStatus}</div></div>
        <div class="item"><div class="label">Relatos antes novo lote</div><div class="value">${reportsBeforeFirstNewBatchShared}</div></div>
        <div class="item"><div class="label">Relatos após novo lote</div><div class="value">${reportsAfterFirstNewBatchShared}</div></div>
        <div class="item"><div class="label">Diferença novo lote</div><div class="value">${newBatchConversionDifferenceAbsolute}</div></div>
      </div>
      <h2>Top bairros</h2>
      <ul>${list(snapshot.topNeighborhoods.length > 0 ? snapshot.topNeighborhoods.map((item) => `${item.bairro}: ${item.quantidade}`) : ["Sem bairros registrados."])}</ul>
      <h2>Top pautas</h2>
      <ul>${list(snapshot.topTopics.length > 0 ? snapshot.topTopics.map((item) => `${item.pauta}: ${item.quantidade}`) : ["Sem pautas registradas."])}</ul>
      <div class="footer">Snapshot territorial agregado. Não contém dados pessoais nem relatos brutos.</div>
    </body>
    </html>
  `;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador", "comunicacao"]);
    const { id } = await params;
    const snapshot = await getTerritorialSnapshot(id);

    if (!snapshot) return new NextResponse("Not Found", { status: 404 });

    const format = req.nextUrl.searchParams.get("format") === "html" ? "html" : "markdown";

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "territorial.snapshot_exported",
      entityType: "territorial_listening_daily_snapshots",
      entityId: id,
      summary: `Snapshot territorial exportado em ${format}.`,
      metadata: {
        window_id: snapshot.windowId,
        snapshot_date: snapshot.snapshotDate,
        status: snapshot.status,
        format,
      },
    });

    if (format === "html") {
      return new NextResponse(buildHtml(snapshot), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new NextResponse(buildMarkdown(snapshot), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="snapshot-territorial-${id}.md"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na exportação." }, { status: 500 });
  }
}