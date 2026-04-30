/**
 * Simple keyword-based topic suggestion rules.
 * Focuses on content analysis, not person profiling.
 */

export type TopicSuggestion = {
  slug: string;
  confidence: number;
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  transporte: ["ônibus", "tarifa", "linha", "ponto", "transporte", "mobilidade", "passageiro", "passagem"],
  saude: ["posto", "hospital", "UPA", "HSJB", "SUS", "médico", "exame", "remédio", "atendimento", "saúde"],
  csn: ["CSN", "usina", "companhia siderúrgica", "escória", "siderúrgica"],
  poluicao: ["pó preto", "poluição", "qualidade do ar", "sujeira", "resíduo"],
  educacao: ["escola", "professor", "creche", "merenda", "ensino", "aula", "estudante"],
  bairro: ["bairro", "rua", "vila", "retiro", "aterrado", "conforto", "ponte alta", "santa cruz", "belmonte"],
  moradia: ["casa", "moradia", "habitação", "aluguel", "teto"],
  seguranca_publica: ["segurança", "polícia", "iluminação", "assalto", "crime", "guarda municipal"],
  denuncia: ["denúncia", "absurdo", "vergonha", "abandonado", "errado", "fiscaliza"],
};

/**
 * Suggests topics based on keywords found in text.
 * @param text The interaction or post content to analyze.
 * @returns Array of suggested topics with confidence scores.
 */
export function suggestTopicsForText(text: string | null): TopicSuggestion[] {
  if (!text) return [];

  const normalizedText = text.toLowerCase();
  const suggestions: TopicSuggestion[] = [];

  for (const [slug, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matches = keywords.filter((kw) => normalizedText.includes(kw.toLowerCase()));
    
    if (matches.length > 0) {
      // Confidence logic: more matches = higher confidence, capped at 0.95
      // Rule suggestion source is never 1.0 (requires operator confirmation)
      const confidence = Math.min(0.5 + matches.length * 0.1, 0.95);
      suggestions.push({ slug, confidence });
    }
  }

  // Sort by confidence descending
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Forbidden labels that must never be used as topics or inferred from text.
 */
export const FORBIDDEN_LABELS = [
  "voto_certo",
  "persuadivel",
  "opositor",
  "ideologia",
  "religiao",
  "renda",
  "saude_pessoal",
  "raca",
  "orientacao_sexual",
];

export function isForbiddenLabel(label: string): boolean {
  return FORBIDDEN_LABELS.includes(label.toLowerCase());
}
