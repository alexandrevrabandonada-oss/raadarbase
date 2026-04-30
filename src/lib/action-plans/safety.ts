export const FORBIDDEN_TERMS = [
  "voto certo",
  "persuadível",
  "opositor",
  "ideologia",
  "religião",
  "renda",
  "raça",
  "orientação sexual",
  "saúde pessoal",
  "perfil psicológico",
  "microtargeting",
  "disparo em massa",
  "robô de DM"
];

export interface SafetyResult {
  isSafe: boolean;
  detectedTerms: string[];
}

/**
 * Verifica se o texto contém termos proibidos pela governança.
 */
export function checkTextSafety(text: string | null | undefined): SafetyResult {
  if (!text) return { isSafe: true, detectedTerms: [] };

  const normalizedText = text.toLowerCase();
  const detectedTerms = FORBIDDEN_TERMS.filter(term => 
    normalizedText.includes(term.toLowerCase())
  );

  return {
    isSafe: detectedTerms.length === 0,
    detectedTerms
  };
}

/**
 * Sanitiza dados para garantir que PII não vazem para os planos de ação.
 */
export function sanitizeActionPlanData<T>(data: T): T {
  if (typeof data !== 'object' || data === null) return data;

  const serialized = JSON.stringify(data);
  // Remove padrões simples de email e telefone se encontrados por acidente
  const sanitized = serialized
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REMOVIDO]")
    .replace(/\+?\d{2,3}[- ]?\d{4,5}[- ]?\d{4}/g, "[TELEFONE_REMOVIDO]");

  return JSON.parse(sanitized);
}
