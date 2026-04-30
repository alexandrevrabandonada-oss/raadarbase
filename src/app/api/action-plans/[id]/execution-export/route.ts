/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { getActionPlan } from "@/lib/data/action-plans";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { sanitizeEvidenceText } from "@/lib/action-execution/safety";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireInternalSession();
    const { id } = await params;
    const plan = await getActionPlan(id);

    if (!plan) return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });

    const format = req.nextUrl.searchParams.get("format") || "markdown";

    // Log de auditoria
    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "action_execution.exported",
      entityType: "action_plans",
      entityId: id,
      summary: `Exportação de execução do plano: ${plan.title} (formato: ${format})`
    });

    const content = generateExportContent(plan, format);

    if (format === "html") {
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="execucao-${id}.html"`
        }
      });
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="execucao-${id}.md"`
      }
    });

  } catch {
    return NextResponse.json({ error: "Erro na exportação" }, { status: 500 });
  }
}

function generateExportContent(plan: any, format: string) {
  const title = `Relatório de Execução: ${plan.title}`;
  const meta = `Tema: ${plan.topic?.name || 'Sem tema'} | Status: ${plan.status} | Prazo: ${plan.due_date || 'N/A'}`;
  const items = plan.items.map((item: any) => {
    const evidence = (item.action_item_evidence || []).map((e: any) => 
      `- [${e.evidence_type}] ${sanitizeEvidenceText(e.title)}${e.url ? ` (${e.url})` : ''}`
    ).join('\n');
    
    const result = item.action_item_results ? `
#### Resultado:
${sanitizeEvidenceText(item.action_item_results.result_summary)}
- **Aprendizados:** ${sanitizeEvidenceText(item.action_item_results.lessons_learned || 'N/A')}
- **Próximo Passo:** ${sanitizeEvidenceText(item.action_item_results.next_step || 'N/A')}
` : '*Nenhum resultado registrado.*';

    return `
### ${item.title} [${item.status}]
${item.description || ''}
${evidence ? '\n#### Evidências:\n' + evidence : ''}
${result}
`;
  }).join('\n---\n');

  const footer = `
---
**Documento interno de execução coletiva. Não utilizar para perfilamento individual, disparo em massa ou segmentação eleitoral sensível.**
Gerado por Radar de Base em ${new Date().toLocaleDateString('pt-BR')}.
`;

  if (format === "html") {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; color: #333; }
          h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
          h2 { color: #555; }
          .item { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
          .footer { font-size: 12px; color: #777; margin-top: 40px; font-style: italic; border-top: 1px solid #eee; padding-top: 20px; }
          .badge { background: #eee; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p><strong>${meta}</strong></p>
        <div className="content">
          ${items.replace(/\n/g, '<br>')}
        </div>
        <div class="footer">${footer.replace(/\n/g, '<br>')}</div>
      </body>
      </html>
    `;
  }

  return `# ${title}\n\n**${meta}**\n\n${items}\n\n${footer}`;
}
