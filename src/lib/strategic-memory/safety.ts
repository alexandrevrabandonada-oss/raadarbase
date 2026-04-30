/* eslint-disable @typescript-eslint/no-explicit-any */
import { createIncident } from "@/lib/data/incidents";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export const FORBIDDEN_MEMORY_TERMS = [
  "voto certo",
  "persuadível",
  "opositor",
  "robô de DM",
  "disparo em massa",
  "microtargeting",
  "perfil psicológico",
  "apoiador",
  "oposição",
  "voto provável",
  "score político",
  "ideologia da pessoa",
  "religião da pessoa"
];

const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g,
  cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
  titulo_eleitor: /\d{12}/g,
};

type MemorySanitizable = Record<string, unknown> & {
  title?: unknown;
  summary?: unknown;
};

export function containsForbiddenMemoryTerm(text: string | null | undefined): string[] {
  if (!text) return [];
  
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedText = normalize(text);
  
  return FORBIDDEN_MEMORY_TERMS.filter(term => {
    const normalizedTerm = normalize(term);
    return normalizedText.includes(normalizedTerm);
  });
}

export function sanitizeMemoryText(text: string | null | undefined): string {
  if (!text) return "";
  let sanitized = text;
  sanitized = sanitized.replace(PII_PATTERNS.email, "[EMAIL_REMOVIDO]");
  sanitized = sanitized.replace(PII_PATTERNS.phone, "[TELEFONE_REMOVIDO]");
  sanitized = sanitized.replace(PII_PATTERNS.cpf, "[CPF_REMOVIDO]");
  sanitized = sanitized.replace(PII_PATTERNS.titulo_eleitor, "[TITULO_REMOVIDO]");
  return sanitized;
}

export async function validateMemoryInput(
  title: string,
  summary: string,
  actorEmail: string,
  actorId: string
): Promise<{ isSafe: boolean; detectedTerms: string[] }> {
  const detected = [
    ...containsForbiddenMemoryTerm(title),
    ...containsForbiddenMemoryTerm(summary)
  ];

  if (detected.length > 0) {
    const uniqueTerms = [...new Set(detected)];
    
    // Log de auditoria
    await writeAuditLog({
      actorId,
      actorEmail,
      action: "strategic_memory.forbidden_term_detected",
      entityType: "strategic_memories",
      entityId: null,
      summary: `Termos proibidos detectados em memória estratégica: ${uniqueTerms.join(", ")}`,
      metadata: { detectedTerms: uniqueTerms, title, summary }
    });

    // Incidente
    await createIncident({
      kind: "forbidden_term_policy_violation",
      severity: "warning",
      status: "open",
      title: "Violação de Governança em Memória Estratégica",
      description: `O usuário ${actorEmail} tentou registrar memória estratégica com termos proibidos: ${uniqueTerms.join(", ")}.`,
      related_entity_type: "strategic_memories",
      actor_email: actorEmail
    });

    return { isSafe: false, detectedTerms: uniqueTerms };
  }

  return { isSafe: true, detectedTerms: [] };
}

export function sanitizeMemoryInputObject<T extends MemorySanitizable>(input: T): T {
  const sanitized: T = { ...input };
  if (typeof sanitized.title === "string") sanitized.title = sanitizeMemoryText(sanitized.title);
  if (typeof sanitized.summary === "string") sanitized.summary = sanitizeMemoryText(sanitized.summary);
  return sanitized;
}
