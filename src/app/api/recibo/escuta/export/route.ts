import { NextResponse } from "next/server";
import { getPublicListeningReceipt } from "@/lib/data/public-listening-receipt";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "markdown";

    const receipt = await getPublicListeningReceipt();

    if (format === "html") {
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Recibo Público da Escuta</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; line-height: 1.6; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        .grid { display: flex; gap: 2rem; margin-top: 1rem; }
        .box { background: #f9f9f9; border: 1px solid #ddd; padding: 1rem; border-radius: 8px; flex: 1; text-align: center; }
        .box strong { display: block; font-size: 1.5rem; margin-top: 0.5rem; }
        .footer { margin-top: 3rem; font-size: 0.8rem; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 1rem; }
        ul { list-style: none; padding: 0; }
        li { padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    </style>
</head>
<body>
    <h1>Recibo Público da Escuta</h1>
    <p><strong>Período:</strong> ${receipt.periodStart} a ${receipt.periodEnd}</p>

    <div class="grid">
        <div class="box">Pessoas Alcançadas<strong>${receipt.topics.uniquePeopleReached}</strong></div>
        <div class="box">Relatos Diretos<strong>${receipt.territorial?.totalReports ?? 0}</strong></div>
        <div class="box">Ações Criadas<strong>${receipt.actions.totalActions}</strong></div>
    </div>

    <h2>Principais Temas Ouvidos</h2>
    ${receipt.topics.topics.length > 0 ? `
    <ul>
        ${receipt.topics.topics.map(t => `<li><span>${t.name}</span> <span>${t.interactionCount} interações</span></li>`).join('')}
    </ul>
    ` : '<p>Nenhum tema destacado no período.</p>'}

    <h2>Ações Corretivas em Andamento</h2>
    <div class="grid">
        <div class="box">Planejadas<strong>${receipt.actions.plannedActions}</strong></div>
        <div class="box">Em andamento<strong>${receipt.actions.doingActions}</strong></div>
        <div class="box">Concluídas<strong>${receipt.actions.doneActions}</strong></div>
    </div>

    <div class="footer">
        Gerado em: ${new Date(receipt.lastUpdatedAt).toLocaleString("pt-BR")}<br>
        Recibo público agregado. Não contém dados pessoais, comentários brutos nem perfilamento individual.
    </div>
    <script>
        window.onload = () => window.print();
    </script>
</body>
</html>`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // Default to markdown
    let md = `# Recibo Público da Escuta\n\n`;
    md += `**Período:** ${receipt.periodStart} a ${receipt.periodEnd}\n\n`;
    
    md += `## Participação Geral\n`;
    md += `- **Pessoas alcançadas publicamente:** ${receipt.topics.uniquePeopleReached}\n`;
    md += `- **Relatos diretos de escuta territorial:** ${receipt.territorial?.totalReports ?? 0}\n`;
    md += `- **Total de ações corretivas criadas a partir das demandas:** ${receipt.actions.totalActions}\n\n`;
    
    md += `## Principais Temas Ouvidos\n`;
    if (receipt.topics.topics.length > 0) {
      for (const t of receipt.topics.topics) {
        md += `- ${t.name} (${t.interactionCount} interações)\n`;
      }
    } else {
      md += `Nenhum tema destacado no período.\n`;
    }
    md += `\n`;

    md += `## O que estamos fazendo\n`;
    md += `- Ações Planejadas: ${receipt.actions.plannedActions}\n`;
    md += `- Ações Em Andamento: ${receipt.actions.doingActions}\n`;
    md += `- Ações Concluídas: ${receipt.actions.doneActions}\n\n`;

    md += `***\n`;
    md += `*Gerado em: ${new Date(receipt.lastUpdatedAt).toLocaleString("pt-BR")}*\n`;
    md += `*Recibo público agregado. Não contém dados pessoais, comentários brutos nem perfilamento individual.*\n`;

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="recibo_publico_escuta.md"',
      },
    });

  } catch (error) {
    console.error("[public_receipt_export] Error:", error);
    return NextResponse.json({ error: "Falha ao gerar recibo público" }, { status: 500 });
  }
}
