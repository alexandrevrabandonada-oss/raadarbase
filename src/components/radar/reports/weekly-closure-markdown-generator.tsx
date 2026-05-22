"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy, Download, FileText, MessageSquare } from "lucide-react";
import type { WeeklyRhythmState } from "@/lib/data/weekly-rhythm";
import { useToast } from "@/hooks/use-toast";

type WeeklyClosureAlert = {
  title: string;
  nextStep: string;
  count: number;
};

type WeeklyClosureNarrativeData = {
  weeklyRhythmState: WeeklyRhythmState;
  linksPrepared: number;
  conversationsRegistered: number;
  referralsMade: number;
  fieldActions: number;
  territoriesInMobilization: number;
  careBase: {
    doNotContactRespected: number;
    sensitiveAlertsCount: number;
    dataUnderReview: number;
    eligibleForReviewCount: number;
  };
  cycleAlerts: WeeklyClosureAlert[];
};

function sanitizePrivacy(text: string) {
  return text
    .replace(/@[a-zA-Z0-9_\.]+/g, "[identificador ocultado]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[contato ocultado]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[contato ocultado]");
}

function resolveWeekPhase(state: WeeklyRhythmState) {
  return `${state.phase.name} (${state.phase.description})`;
}

function resolveSummary(state: WeeklyRhythmState) {
  if (state.status === "fechado") {
    return "Semana encerrada com fechamento iniciado e pendências mapeadas para continuidade responsável.";
  }

  if (state.status === "saudavel") {
    return "Semana com avanço consistente, com a maior parte dos rituais concluídos e atenção aos pontos sensíveis.";
  }

  if (state.status === "atencao") {
    return "Semana com evolução parcial e sinais de acúmulo, pedindo priorização de fechamentos antes de expandir frentes.";
  }

  return "Semana em construção, com foco em manter constância e transformar pendências em ciclos fechados.";
}

function buildMarkdown(data: WeeklyClosureNarrativeData) {
  const generatedAt = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const pendingLines = data.cycleAlerts.length
    ? data.cycleAlerts.map((alert) => `- ${alert.title}: ${alert.count} | ${alert.nextStep}`)
    : ["- Sem travas críticas no momento. Manter rotina de revisão leve e fechamento contínuo."];

  const qualitativeLearnings = [
    "Quando o ciclo é fechado no mesmo período, a equipe reduz retrabalho e ganha clareza operacional.",
    "Acompanhamento territorial com cadência semanal melhora a transição de mobilização para campo.",
    "Micro-pausas e blocos curtos sustentam qualidade sem sobrecarga individual.",
  ];

  const nextSteps = data.cycleAlerts.length
    ? data.cycleAlerts.slice(0, 3).map((alert) => `- ${alert.nextStep}`)
    : [
        "- Consolidar aprendizados da semana no rito de planejamento.",
        "- Manter revisão de dados sensíveis e inativos como rotina fixa.",
      ];

  const markdown = [
    "# Fechamento Semanal - Radar de Base",
    "",
    `Gerado em: ${generatedAt}`,
    "",
    "## Resumo da semana",
    resolveSummary(data.weeklyRhythmState),
    "",
    "## Fase da semana",
    `- ${resolveWeekPhase(data.weeklyRhythmState)}`,
    "",
    "## Indicadores coletivos",
    `- Vínculos preparados: ${data.linksPrepared}`,
    `- Conversas registradas: ${data.conversationsRegistered}`,
    `- Encaminhamentos: ${data.referralsMade}`,
    `- Ações de campo: ${data.fieldActions}`,
    `- Territórios em mobilização: ${data.territoriesInMobilization}`,
    "",
    "## Cuidado da base",
    `- Não abordar respeitados: ${data.careBase.doNotContactRespected}`,
    `- Alertas de notas sensíveis: ${data.careBase.sensitiveAlertsCount}`,
    `- Dados em revisão: ${data.careBase.dataUnderReview}`,
    `- Registros para revisão (+180 dias): ${data.careBase.eligibleForReviewCount}`,
    "",
    "## Pendências principais",
    ...pendingLines,
    "",
    "## Aprendizados qualitativos",
    ...qualitativeLearnings.map((item) => `- ${item}`),
    "",
    "## Próximos passos",
    ...nextSteps,
    "",
    "---",
    "Narrativa coletiva gerada para uso interno. Sem dados individuais, sem ranking e com foco em aprendizagem operacional.",
  ].join("\n");

  return sanitizePrivacy(markdown);
}

function convertToWhatsAppFormat(markdown: string): string {
  return markdown
    // Convert headers (e.g. # title, ## title)
    .replace(/^#\s+(.+)$/gm, (match, p1) => `*${p1.toUpperCase()}*`)
    .replace(/^##\s+(.+)$/gm, (match, p1) => `*${p1.toUpperCase()}*`)
    // Convert lists (e.g. - item) to bullet points
    .replace(/^-\s+(.+)$/gm, (match, p1) => `• ${p1}`)
    // Convert bold (e.g. **bold**) to single *bold* (WhatsApp style)
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    // Convert horizontal rule ---
    .replace(/^---$/gm, '────────────────────────');
}

export function WeeklyClosureMarkdownGenerator({ data }: { data: WeeklyClosureNarrativeData }) {
  const [generated, setGenerated] = useState<string>("");
  const { toast } = useToast();

  const filename = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `fechamento-semanal-${year}-${month}-${day}.md`;
  }, []);

  function onGenerate() {
    setGenerated(buildMarkdown(data));
  }

  async function onCopy() {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    toast({
      title: "Copiado para o Clipboard 📋",
      description: "O relatório em Markdown foi copiado com sucesso.",
    });
  }

  async function onCopyWhatsApp() {
    if (!generated) return;
    const formatted = convertToWhatsAppFormat(generated);
    await navigator.clipboard.writeText(formatted);
    toast({
      title: "Pronto para o WhatsApp 📲",
      description: "O texto formatado foi copiado. Só colar no grupo de coordenação!",
    });
  }

  function onDownload() {
    if (!generated) return;
    const blob = new Blob([generated], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="border-indigo-100 bg-indigo-50/30">
      <CardHeader>
        <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-800 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Fechamento Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onGenerate} className="font-black">
            Gerar fechamento da semana
          </Button>
          <Button onClick={onCopy} variant="outline" disabled={!generated}>
            <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar .md
          </Button>
          <Button onClick={onCopyWhatsApp} variant="outline" disabled={!generated} className="border-emerald-600/35 hover:bg-emerald-500/10 text-emerald-700 hover:text-emerald-800 font-bold">
            <MessageSquare className="mr-2 h-4 w-4" /> Copiar p/ WhatsApp
          </Button>
          <Button onClick={onDownload} variant="outline" disabled={!generated}>
            <Download className="mr-2 h-4 w-4" /> Baixar .md
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="font-bold">Tom coletivo e analítico</Badge>
          <Badge variant="secondary" className="font-bold">Sem dados individuais</Badge>
          <Badge variant="secondary" className="font-bold">Pronto para comunicação interna</Badge>
        </div>

        <textarea
          readOnly
          value={generated}
          placeholder="Clique em 'Gerar fechamento da semana' para produzir a narrativa semanal em Markdown."
          className="w-full min-h-[320px] rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed font-mono"
        />
      </CardContent>
    </Card>
  );
}
