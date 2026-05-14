export const RHYTHM_ALERT_PRIORITY = [
  "urgent_care",
  "pending_returns",
  "unassigned_missions",
  "open_referrals",
  "field_without_closure",
  "pending_memory",
  "territory_ready",
] as const;

export type RhythmAlertPriorityType = (typeof RHYTHM_ALERT_PRIORITY)[number];

export function rhythmSeverityLabel(severity: "stable" | "attention" | "critical") {
  if (severity === "critical") return "Crítica";
  if (severity === "attention") return "Atenção";
  return "Estável";
}

export function rhythmDecisionSupportCopy(type: RhythmAlertPriorityType): string {
  switch (type) {
    case "urgent_care":
      return "Cuidado vem antes de volume. Resolva pendências éticas e de revisão antes de abrir novas frentes.";
    case "pending_returns":
      return "Há retornos pendentes. Registre o que já aconteceu antes de abrir novas frentes.";
    case "unassigned_missions":
      return "Há missões sem responsável. Distribua em blocos pequenos para evitar perda de contexto.";
    case "open_referrals":
      return "Encaminhamentos sem destino claro travam a jornada. Dê um próximo passo explícito e consentido.";
    case "field_without_closure":
      return "Campo realizado sem memória ainda é ciclo aberto.";
    case "pending_memory":
      return "Memória pendente enfraquece a continuidade. Feche o aprendizado enquanto o contexto ainda está vivo.";
    case "territory_ready":
      return "Há território pronto para ação. Transforme leitura em passo operacional concreto.";
  }
}
