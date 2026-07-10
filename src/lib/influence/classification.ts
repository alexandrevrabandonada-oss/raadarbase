import { INFLUENCE_CATEGORIES, type InfluenceCategory } from "@/lib/influence/types";

export type ClassificationInput = {
  username: string;
  nome?: string | null;
  bio?: string | null;
  site?: string | null;
  empresa?: boolean;
  criador?: boolean;
};

export type ClassificationResult = {
  categoria: InfluenceCategory;
  confidence: number;
  source: "regra" | "ia";
  rationale: string;
};

export type AiClassifier = (input: ClassificationInput) => Promise<ClassificationResult | null>;

const RULES: Array<{ categoria: InfluenceCategory; confidence: number; terms: RegExp }> = [
  { categoria: "sindicato", confidence: 0.98, terms: /\b(sindicato|sindical|sindicalista)\b/i },
  { categoria: "medico", confidence: 0.97, terms: /\b(m[eé]dic[oa]|crm\s*[-/]?\s*\d+|medicina)\b/i },
  { categoria: "advogado", confidence: 0.97, terms: /\b(advogad[oa]|oab\s*[-/]?\s*\d+|advocacia)\b/i },
  { categoria: "jornalista", confidence: 0.95, terms: /\b(jornalista|jornalismo|rep[oó]rter|not[ií]cias|imprensa)\b/i },
  { categoria: "professor", confidence: 0.94, terms: /\b(professor(?:a)?|docente|educador(?:a)?)\b/i },
  { categoria: "politico", confidence: 0.93, terms: /\b(vereador(?:a)?|deputad[oa]|prefeit[oa]|senador(?:a)?|mandato|candidata?o?)\b/i },
  { categoria: "ong", confidence: 0.93, terms: /\b(ong|organiza[cç][aã]o\s+n[aã]o\s+governamental|instituto\s+social)\b/i },
  { categoria: "ambientalista", confidence: 0.91, terms: /\b(ambientalista|meio\s+ambiente|ecologia|sustentabilidade)\b/i },
  { categoria: "servidor_publico", confidence: 0.9, terms: /\b(servidor(?:a)?\s+p[uú]blic[oa]|funcion[aá]ri[oa]\s+p[uú]blic[oa])\b/i },
  { categoria: "artista", confidence: 0.9, terms: /\b(artista|m[uú]sic[oa]|cantor(?:a)?|ator|atriz|fot[oó]graf[oa]|designer)\b/i },
  { categoria: "estudante", confidence: 0.88, terms: /\b(estudante|universit[aá]ri[oa]|graduand[oa])\b/i },
  { categoria: "comercio", confidence: 0.9, terms: /\b(loja|delivery|restaurante|caf[eé]|sal[aã]o|varejo|com[eé]rcio)\b/i },
  { categoria: "empresa", confidence: 0.88, terms: /\b(empresa|oficial|solu[cç][oõ]es|servi[cç]os|consultoria)\b/i },
  { categoria: "influenciador", confidence: 0.84, terms: /\b(influenciador(?:a)?|creator|criador(?:a)?\s+de\s+conte[uú]do|blogueir[oa])\b/i },
];

export function classifyWithRules(input: ClassificationInput): ClassificationResult | null {
  const text = [input.username, input.nome, input.bio, input.site].filter(Boolean).join(" ");
  for (const rule of RULES) {
    if (rule.terms.test(text)) {
      return { categoria: rule.categoria, confidence: rule.confidence, source: "regra", rationale: `Sinal explícito compatível com ${rule.categoria}.` };
    }
  }
  if (input.empresa) return { categoria: "empresa", confidence: 0.82, source: "regra", rationale: "Conta marcada como empresa na fonte autorizada." };
  if (input.criador) return { categoria: "influenciador", confidence: 0.72, source: "regra", rationale: "Conta marcada como criador na fonte autorizada." };
  return null;
}

function isValidAiResult(value: ClassificationResult | null): value is ClassificationResult {
  return Boolean(value && INFLUENCE_CATEGORIES.includes(value.categoria) && value.confidence >= 0 && value.confidence <= 1);
}

export async function classifyProfile(input: ClassificationInput, aiClassifier?: AiClassifier): Promise<ClassificationResult> {
  const ruleResult = classifyWithRules(input);
  if (ruleResult) return ruleResult;
  if (aiClassifier) {
    const result = await aiClassifier(input);
    if (isValidAiResult(result)) return { ...result, source: "ia" };
  }
  return { categoria: "outros", confidence: 0, source: "regra", rationale: "Sem evidência suficiente; classificação não inferida." };
}

export function createHttpAiClassifier(endpoint: string, apiKey?: string): AiClassifier {
  return async (input) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({
        task: "Classifique apenas com evidência textual. Não infira atributos sensíveis.",
        allowedCategories: INFLUENCE_CATEGORIES,
        profile: input,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const value: unknown = await response.json();
    if (!value || typeof value !== "object") return null;
    const result = value as ClassificationResult;
    return isValidAiResult(result) ? result : null;
  };
}

