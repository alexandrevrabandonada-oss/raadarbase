/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { getStrategicMemory } from "@/lib/data/strategic-memory";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { sanitizeMemoryText } from "@/lib/strategic-memory/safety";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireInternalSession();
    const { id } = await params;
    const memory = await getStrategicMemory(id);

    if (!memory) return NextResponse.json({ error: "Memória não encontrada" }, { status: 404 });

    const format = req.nextUrl.searchParams.get("format") || "markdown";

    // Log de auditoria
    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email!,
      action: "strategic_memory.exported",
      entityType: "strategic_memories",
      entityId: id,
      summary: `Exportação de memória estratégica: ${memory.title} (formato: ${format})`
    });

    const content = generateExportContent(memory, format);

    if (format === "html") {
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="memoria-${id}.html"`
        }
      });
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="memoria-${id}.md"`
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro na exportação" }, { status: 500 });
  }
}

function generateExportContent(memory: any, format: string) {
  const title = `Memória Estratégica: ${memory.title}`;
  const meta = `Tema: ${memory.topic?.name || 'Geral'} | Território: ${memory.territory || 'N/A'} | Período: ${memory.period_start || '...'} a ${memory.period_end || '...'}`;
  
  const footer = `
---
**Documento interno de memória estratégica. Não utilizar para perfilamento individual, disparo em massa ou segmentação eleitoral sensível.**
Gerado por Radar de Base em ${new Date().toLocaleDateString('pt-BR')}.
`;

  const summary = sanitizeMemoryText(memory.summary);

  if (format === "html") {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; color: #333; }
          h1 { border-bottom: 2px solid #6366f1; padding-bottom: 10px; color: #4338ca; }
          h2 { color: #555; }
          .meta { font-size: 12px; color: #666; margin-bottom: 30px; }
          .content { background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0; font-style: italic; }
          .footer { font-size: 12px; color: #777; margin-top: 40px; font-style: italic; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">${meta}</div>
        <div class="content">
          ${summary.replace(/\n/g, '<br>')}
        </div>
        <div class="footer">${footer.replace(/\n/g, '<br>')}</div>
      </body>
      </html>
    `;
  }

  return `# ${title}\n\n**${meta}**\n\n> ${summary}\n\n${footer}`;
}
