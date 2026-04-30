/* eslint-disable @typescript-eslint/no-explicit-any */
import { createIncident } from "@/lib/data/incidents";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export const FORBIDDEN_EXECUTION_TERMS = [
  "voto certo",
  "persuadível",
  "opositor",
  "robô de DM",
  "disparo em massa",
  "microtargeting",
  "perfil psicológico",
  "apoiador",
  "oposição",
  "voto provável"
];

const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g,
  cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
  titulo_eleitor: /\d{12}/g,
};

type ExecutionSanitizable = Record<string, unknown> & {
  title?: unknown;
  description?: unknown;
  result_summary?: unknown;
  public_response?: unknown;
  lessons_learned?: unknown;
  next_step?: unknown;
};

export function containsForbiddenExecutionTerm(text: string | null | undefined): string[] {
  if (!text) return [];
  
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedText = normalize(text);
  
  return FORBIDDEN_EXECUTION_TERMS.filter(term => {
    const normalizedTerm = normalize(term);
    return normalizedText.includes(normalizedTerm);
  });
}

export function sanitizeEvidenceText(text: string | null | undefined): string {
  if (!text) return "";
  let sanitized = text;
  sanitized = sanitized.replace(PII_PATTERNS.email, "[EMAIL_REMOVIDO]");
  sanitized = sanitized.replace(PII_PATTERNS.phone, "[TELEFONE_REMOVIDO]");
  sanitized = sanitized.replace(PII_PATTERNS.cpf, "[CPF_REMOVIDO]");
  sanitized = sanitized.replace(PII_PATTERNS.titulo_eleitor, "[TITULO_REMOVIDO]");
  return sanitized;
}

export async function validateExecutionSafety(
  title: string,
  description: string | null | undefined,
  actorEmail: string,
  actorId: string,
  entityType: "action_item_evidence" | "action_item_results"
): Promise<{ isSafe: boolean; detectedTerms: string[] }> {
  const detected = [
    ...containsForbiddenExecutionTerm(title),
    ...containsForbiddenExecutionTerm(description)
  ];

  if (detected.length > 0) {
    const uniqueTerms = [...new Set(detected)];
    
    // Log de auditoria
    await writeAuditLog({
      actorId,
      actorEmail,
      action: "action_execution.forbidden_term_detected",
      entityType,
      entityId: null,
      summary: `Termos proibidos detectados em execução: ${uniqueTerms.join(", ")}`,
      metadata: { detectedTerms: uniqueTerms, title, description }
    });

    // Incidente
    await createIncident({
      kind: "forbidden_term_policy_violation",
      severity: "warning",
      status: "open",
      title: "Violação de Governança em Execução",
      description: `O usuário ${actorEmail} tentou registrar ${entityType === 'action_item_evidence' ? 'evidência' : 'resultado'} com termos proibidos: ${uniqueTerms.join(", ")}.`,
      related_entity_type: entityType,
      actor_email: actorEmail
    });

    return { isSafe: false, detectedTerms: uniqueTerms };
  }

  return { isSafe: true, detectedTerms: [] };
}

export function sanitizeExecutionInput<T extends ExecutionSanitizable>(input: T): T {
  const sanitized: T = { ...input };
  if (typeof sanitized.title === "string") sanitized.title = sanitizeEvidenceText(sanitized.title);
  if (typeof sanitized.description === "string") sanitized.description = sanitizeEvidenceText(sanitized.description);
  if (typeof sanitized.result_summary === "string") sanitized.result_summary = sanitizeEvidenceText(sanitized.result_summary);
  if (typeof sanitized.public_response === "string") sanitized.public_response = sanitizeEvidenceText(sanitized.public_response);
  if (typeof sanitized.lessons_learned === "string") sanitized.lessons_learned = sanitizeEvidenceText(sanitized.lessons_learned);
  if (typeof sanitized.next_step === "string") sanitized.next_step = sanitizeEvidenceText(sanitized.next_step);
  return sanitized;
}
