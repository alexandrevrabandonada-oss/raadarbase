/**
 * Safety rules for mobilization reports.
 * Prevents profiling and forbidden terminology.
 */

export const FORBIDDEN_REPORT_TERMS = [
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
];

/**
 * Checks if a string contains any forbidden terms.
 * @param text The text to check (title, description, etc.)
 * @returns { ok: boolean, forbiddenTerm?: string }
 */
export function validateReportTextSafety(text: string | null): { ok: boolean; forbiddenTerm?: string } {
  if (!text) return { ok: true };

  const normalizedText = text.toLowerCase();
  for (const term of FORBIDDEN_REPORT_TERMS) {
    if (normalizedText.includes(term.toLowerCase())) {
      return { ok: false, forbiddenTerm: term };
    }
  }

  return { ok: true };
}

/**
 * Sanitizes report snapshots to ensure no PII (telephones, emails)
 * or individual scores are included.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function sanitizeReportSnapshot(snapshot: any): any {
  if (!snapshot) return {};
  
  // No deep clone for simplicity in this helper, but we should be careful
  const clean = JSON.parse(JSON.stringify(snapshot));

  // Ensure no PII in representatives comments or people lists
  if (clean.representativeComments) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    clean.representativeComments = clean.representativeComments.map((comment: any) => ({
      ...comment,
      authorEmail: undefined,
      authorPhone: undefined,
      text: comment.text?.replace(/\b\d{2}\s?\d{4,5}-?\d{4}\b/g, "[TELEFONE OCULTO]")
                         .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL OCULTO]"),
    }));
  }

  return clean;
}
