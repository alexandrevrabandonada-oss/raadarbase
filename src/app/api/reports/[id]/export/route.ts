import { NextRequest, NextResponse } from "next/server";
import { getInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getMobilizationReport } from "@/lib/data/reports";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getInternalSession();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    // Apenas admin e operador podem exportar
    // Como estamos em uma API route, usamos o email/id da sessão diretamente
    // No Radar de Base, o papel é verificado via helper
    // Para simplificar na API route sem expor demais:
    await requireRole(["admin", "operador"]);

    const report = await getMobilizationReport(id);
    if (!report) return new NextResponse("Not Found", { status: 404 });
    if (report.status !== 'generated') {
      return new NextResponse("Report not generated yet", { status: 400 });
    }

    const format = req.nextUrl.searchParams.get("format") || "markdown";

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "report.exported",
      entityType: "mobilization_reports",
      entityId: id,
      summary: `Relatório exportado em formato ${format}: ${report.title}`,
    });

    if (format === "html") {
      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${report.title}</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; color: #333; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
            .meta { color: #666; font-size: 0.9em; margin-bottom: 30px; }
            .topic { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
            .topic h3 { margin-top: 0; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #999; text-align: center; }
            .warning { background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 5px; font-size: 0.9em; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="warning">
            <strong>Documento Interno de Escuta Pública.</strong><br>
            Este relatório descreve pautas e demandas coletivas. É proibido o uso para perfilamento político individual, segmentação sensível ou microtargeting.
          </div>
          <h1>${report.title}</h1>
          <div class="meta">
            Período: ${report.period_start} a ${report.period_end}<br>
            Gerado em: ${new Date(report.generated_at!).toLocaleString("pt-BR")}<br>
            Pautas analisadas: ${report.topics?.length || 0}
          </div>

          <h2>Resumo de Mobilização</h2>
          <p>${report.description || "Sem descrição adicional."}</p>

          <h2>Engajamento por Pauta</h2>
          ${/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            report.topics?.map((rt: any) => `
            <div class="topic">
              <h3>${rt.topic.name}</h3>
              <p><strong>${rt.interaction_count}</strong> interações de <strong>${rt.people_count}</strong> perfis.</p>
            </div>
          `).join("")}

          <div class="footer">
            Documento gerado internamente pelo Radar de Base - VR Abandonada.<br>
            Não utilizar para disparo em massa ou fins eleitorais sensíveis.
          </div>
        </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Default: Markdown
    const md = `
# ${report.title}

**Período:** ${report.period_start} a ${report.period_end}
**Gerado em:** ${report.generated_at}

## Resumo
${report.description || "N/A"}

## Métricas por Tema
${/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  report.topics?.map((rt: any) => `- **${rt.topic.name}**: ${rt.interaction_count} interações (${rt.people_count} perfis)`).join("\n")}

---
*Documento interno de escuta pública. Não utilizar para disparo em massa, perfilamento individual ou segmentação eleitoral sensível.*
    `;

    return new NextResponse(md, {
      headers: { 
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="relatorio-${id}.md"`
      },
    });

  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 });
  }
}
