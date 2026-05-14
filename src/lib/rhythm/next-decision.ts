import { rhythmDecisionSupportCopy } from "./rhythm-copy";
import type { CycleAlertEngineItem, CycleAlertType } from "./cycle-alert-engine";
import type { OperationalCycleSeverity } from "@/lib/operational-cycle/cycle-types";

export interface RhythmNextDecision {
  type: CycleAlertType | "steady";
  title: string;
  description: string;
  whyNow: string;
  recommendedAction: string;
  href: string;
  ctaLabel: string;
  count: number;
  severity: Extract<OperationalCycleSeverity, "stable" | "attention" | "critical">;
  supportCopy: string;
  guardrailNote?: string;
}

export function buildNextDecision(alerts: CycleAlertEngineItem[]): RhythmNextDecision {
  const topAlert = alerts[0];

  if (!topAlert) {
    return {
      type: "steady",
      title: "Ciclo em dia",
      description: "Nada travado agora. O ritmo da base está estável neste momento.",
      whyNow: "Quando o ciclo está limpo, a coordenação pode operar por preparo e não por incêndio.",
      recommendedAction: "Manter revisão leve, fechar pequenas pontas e preparar a próxima frente com calma.",
      href: "/dashboard",
      ctaLabel: "Ver base",
      count: 0,
      severity: "stable",
      supportCopy: "Sem cobrança extra. Só mantenha o fechamento em dia e preserve o contexto da equipe.",
    };
  }

  const typeForCopy = topAlert.type === "territory_without_action" ? "territory_ready" : topAlert.type;

  return {
    type: topAlert.type,
    title: topAlert.title,
    description: topAlert.description,
    whyNow: topAlert.whyItMatters,
    recommendedAction: topAlert.recommendedAction,
    href: topAlert.href,
    ctaLabel: topAlert.type === "unassigned_missions" ? "Distribuir bloco" : topAlert.type === "field_without_closure" ? "Fechar campo" : "Resolver agora",
    count: topAlert.count,
    severity: topAlert.severity,
    supportCopy: rhythmDecisionSupportCopy(typeForCopy as never),
    guardrailNote: topAlert.guardrailNote,
  };
}
