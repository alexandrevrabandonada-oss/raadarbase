import type { CycleAlertEngineItem } from "./cycle-alert-engine";

export interface RhythmSummary {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  blockedCycles: number;
  status: "steady" | "attention" | "critical";
  microcopy: string;
}

export function buildRhythmSummary(alerts: CycleAlertEngineItem[]): RhythmSummary {
  const criticalAlerts = alerts.filter((alert) => alert.severity === "critical").length;
  const warningAlerts = alerts.filter((alert) => alert.severity === "attention").length;
  const blockedCycles = alerts.reduce((sum, alert) => sum + alert.count, 0);

  const status = criticalAlerts > 0 ? "critical" : warningAlerts > 0 ? "attention" : "steady";
  const microcopy =
    status === "critical"
      ? "Resolver o primeiro bloqueio crítico agora reduz retrabalho no resto do ciclo."
      : status === "attention"
        ? "Há travas abertas, mas a coordenação pode avançar por blocos pequenos e claros."
        : "Nada travado agora. Mantenha a base leve e feche o ciclo antes de abrir outro.";

  return {
    totalAlerts: alerts.length,
    criticalAlerts,
    warningAlerts,
    blockedCycles,
    status,
    microcopy,
  };
}
