import { NextRequest, NextResponse } from "next/server";
import { getInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getMobilizationReport } from "@/lib/data/reports";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { sanitizeReportSnapshot } from "@/lib/reports/safety";

type ReportExportTopic = {
  topic_id: string;
  topic?: {
    name?: string;
  } | null;
  interaction_count: number;
  post_count?: number;
  people_count?: number;
};

type ReportExportPost = {
  post_id: string;
  shortcode: string | null;
  comment_count: number;
  topic_names?: string[];
};

type ReportExportComment = {
  text: string;
  occurredAt: string;
  postShortcode: string | null;
  topicNames?: string[];
};

type ReportExportPending = {
  interactionId: string;
  occurredAt: string;
  excerpt: string;
  suggestedTopicNames?: string[];
};

type ReportExportSnapshot = {
  totals?: {
    postsAnalyzed?: number;
    interactionsAnalyzed?: number;
    uniquePeople?: number;
  };
  period?: {
    start?: string | null;
    end?: string | null;
  };
  topTopics?: ReportExportTopic[];
  topPosts?: ReportExportPost[];
  representativeComments?: ReportExportComment[];
  pendingThemes?: ReportExportPending[];
  publicRecommendations?: string[];
};

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

    const snapshot = sanitizeReportSnapshot((report.snapshot as ReportExportSnapshot) ?? {}) as ReportExportSnapshot;
    const topTopics: ReportExportTopic[] = snapshot.topTopics?.length ? snapshot.topTopics : (report.topics as ReportExportTopic[]) ?? [];
    const topPosts = snapshot.topPosts ?? [];
    const representativeComments = snapshot.representativeComments ?? [];
    const pendingThemes = snapshot.pendingThemes ?? [];
    const publicRecommendations = snapshot.publicRecommendations ?? [];
    const periodStart = snapshot.period?.start ?? report.period_start ?? "-";
    const periodEnd = snapshot.period?.end ?? report.period_end ?? "-";
    const generatedAt = report.generated_at ? new Date(report.generated_at).toLocaleString("pt-BR") : "-";
    const footerText = "Relatório de escuta pública por pauta. Não utilizar para perfilamento individual ou disparo em massa.";

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
            .section { border: 1px solid #ddd; padding: 15px; margin-bottom: 12px; border-radius: 5px; }
            .section h3 { margin: 0 0 8px; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #999; text-align: center; }
            .warning { background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 5px; font-size: 0.9em; margin-bottom: 20px; }
            ul { padding-left: 18px; }
          </style>
        </head>
        <body>
          <div class="warning">
            <strong>Documento Interno de Escuta Pública.</strong><br>
            Este relatório descreve pautas e demandas coletivas. É proibido o uso para perfilamento político individual, segmentação sensível ou microtargeting.
          </div>
          <h1>${report.title}</h1>
          <div class="meta">
            Período: ${periodStart} a ${periodEnd}<br>
            Gerado em: ${generatedAt}<br>
            Pautas analisadas: ${topTopics.length}<br>
            Posts analisados: ${(snapshot.totals?.postsAnalyzed ?? 0)}<br>
            Interações analisadas: ${(snapshot.totals?.interactionsAnalyzed ?? 0)}
          </div>

          <div class="section">
            <h3>Resumo de Mobilização</h3>
            <p>${report.description || "Sem descrição adicional."}</p>
          </div>

          <div class="section">
            <h3>Temas mais mobilizados</h3>
            ${topTopics.map((topic) => `
              <p><strong>${topic.topic?.name ?? topic.topic_id}</strong>: ${topic.interaction_count} interações, ${topic.post_count ?? 0} posts, ${topic.people_count ?? 0} pessoas públicas.</p>
            `).join("")}
          </div>

          <div class="section">
            <h3>Posts com maior volume de comentários</h3>
            ${topPosts.map((post) => `
              <p><strong>${post.shortcode ?? post.post_id}</strong>: ${post.comment_count} comentários${post.topic_names?.length ? ` • Temas: ${post.topic_names.join(", ")}` : ""}</p>
            `).join("")}
          </div>

          <div class="section">
            <h3>Comentários representativos sanitizados</h3>
            ${representativeComments.map((comment) => `
              <p>&quot;${comment.text}&quot;<br><small>${comment.postShortcode ? `Post: ${comment.postShortcode} • ` : ""}${comment.topicNames?.length ? `Temas: ${comment.topicNames.join(", ")} • ` : ""}${comment.occurredAt}</small></p>
            `).join("")}
          </div>

          <div class="section">
            <h3>Temas pendentes de revisão</h3>
            ${pendingThemes.map((item) => `
              <p>&quot;${item.excerpt}&quot;<br><small>Sugestão por regra: ${item.suggestedTopicNames?.length ? item.suggestedTopicNames.join(", ") : "Sem sugestão automática"}</small></p>
            `).join("")}
          </div>

          <div class="section">
            <h3>Recomendações públicas</h3>
            <ul>
              ${publicRecommendations.map((item: string) => `<li>${item}</li>`).join("")}
            </ul>
          </div>

          <div class="footer">
            ${footerText}
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

**Período:** ${periodStart} a ${periodEnd}
**Gerado em:** ${generatedAt}
**Posts analisados:** ${snapshot.totals?.postsAnalyzed ?? 0}
**Interações analisadas:** ${snapshot.totals?.interactionsAnalyzed ?? 0}
**Pessoas públicas únicas:** ${snapshot.totals?.uniquePeople ?? 0}

## Resumo
${report.description || "N/A"}

## Métricas por Tema
${topTopics.map((topic) => `- **${topic.topic?.name ?? topic.topic_id}**: ${topic.interaction_count} interações, ${topic.post_count ?? 0} posts, ${topic.people_count ?? 0} pessoas públicas`).join("\n")}

## Posts com maior volume de comentários
${topPosts.map((post) => `- **${post.shortcode ?? post.post_id}**: ${post.comment_count} comentários${post.topic_names?.length ? ` (${post.topic_names.join(", ")})` : ""}`).join("\n")}

## Comentários representativos sanitizados
${representativeComments.map((comment) => `- "${comment.text}"${comment.postShortcode ? ` • Post: ${comment.postShortcode}` : ""}${comment.topicNames?.length ? ` • Temas: ${comment.topicNames.join(", ")}` : ""}`).join("\n")}

## Temas pendentes de revisão
${pendingThemes.map((item) => `- "${item.excerpt}" • Sugestão por regra: ${item.suggestedTopicNames?.length ? item.suggestedTopicNames.join(", ") : "Sem sugestão automática"}`).join("\n")}

## Recomendações públicas
${publicRecommendations.map((item: string) => `- ${item}`).join("\n")}

---
${footerText}
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
