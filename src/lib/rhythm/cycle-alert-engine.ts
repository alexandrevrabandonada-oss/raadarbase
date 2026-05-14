import { RHYTHM_ALERT_PRIORITY, type RhythmAlertPriorityType } from "./rhythm-copy";
import type { OperationalCycleSeverity } from "@/lib/operational-cycle/cycle-types";

export type CycleAlertType =
  | "unassigned_missions"
  | "pending_returns"
  | "open_referrals"
  | "urgent_care"
  | "field_without_closure"
  | "territory_without_action"
  | "pending_memory"
  | "high_team_load"
  | "territory_ready";

export type CycleAlertSeverity = Extract<OperationalCycleSeverity, "attention" | "critical"> | "stable";

export interface CycleAlertEngineItem {
  type: CycleAlertType;
  severity: CycleAlertSeverity;
  title: string;
  description: string;
  whyItMatters: string;
  recommendedAction: string;
  href: string;
  count: number;
  guardrailNote?: string;
}

export interface CycleAlertEngineInput {
  unassignedMissions: number;
  pendingReturns: number;
  openReferrals: number;
  urgentCare: number;
  fieldWithoutClosure: number;
  territoryWithoutAction: number;
  pendingMemory: number;
  highTeamLoad: number;
  territoriesReady: number;
}

function severityByCount(count: number, warningFrom = 1, criticalFrom = 5): CycleAlertSeverity {
  if (count >= criticalFrom) return "critical";
  if (count >= warningFrom) return "attention";
  return "stable";
}

function buildAlert(
  type: CycleAlertType,
  count: number,
): CycleAlertEngineItem {
  switch (type) {
    case "urgent_care":
      return {
        type,
        severity: severityByCount(count, 1, 1),
        title: "Cuidados urgentes",
        description: "Há registros ou guardrails pedindo revisão imediata antes de qualquer aceleração operacional.",
        whyItMatters: "Quando cuidado ético fica para depois, o restante do ciclo perde confiança e consistência.",
        recommendedAction: "Revisar os pontos sensíveis e confirmar o próximo passo seguro antes de abrir novas frentes.",
        href: "/pessoas?filter=nao_abordar",
        count,
        guardrailNote: "Não abrir contato novo enquanto houver bloqueio ou revisão ética pendente.",
      };
    case "pending_returns":
      return {
        type,
        severity: severityByCount(count, 1, 6),
        title: "Retornos pendentes",
        description: "Há respostas, esperas longas ou DMs preparadas sem fechamento suficiente no ciclo.",
        whyItMatters: "Registrar o que já aconteceu evita duplicidade, insistência indevida e perda de contexto.",
        recommendedAction: "Fechar retornos pendentes antes de puxar novas frentes de abordagem.",
        href: "/abordagem?filter=stale",
        count,
        guardrailNote: "Nenhum alerta aqui autoriza aumentar volume de DM. O foco é fechamento, não pressão.",
      };
    case "unassigned_missions":
      return {
        type,
        severity: severityByCount(count, 1, 4),
        title: "Missões sem responsável",
        description: "Há missões abertas sem dono claro no ciclo atual.",
        whyItMatters: "Sem responsável, a equipe perde contexto e a jornada trava antes de chegar ao próximo passo.",
        recommendedAction: "Distribuir em blocos pequenos para evitar perda de contexto.",
        href: "/abordagem?filter=sem_responsavel",
        count,
      };
    case "open_referrals":
      return {
        type,
        severity: severityByCount(count, 1, 5),
        title: "Encaminhamentos abertos",
        description: "Há pessoas que responderam ou avançaram sem destino claro registrado.",
        whyItMatters: "Encaminhamento pendente é vínculo sem continuidade.",
        recommendedAction: "Escolher caminho com consentimento e registrar o destino do ciclo.",
        href: "/abordagem",
        count,
      };
    case "field_without_closure":
      return {
        type,
        severity: severityByCount(count, 1, 1),
        title: "Campo sem fechamento",
        description: "Há ação de campo realizada sem resultado ou síntese registrada.",
        whyItMatters: "Campo realizado sem memória ainda é ciclo aberto.",
        recommendedAction: "Registrar resultado agregado e transformar o aprendizado em memória operacional.",
        href: "/campo",
        count,
      };
    case "territory_without_action":
      return {
        type,
        severity: severityByCount(count, 1, 3),
        title: "Território em mobilização sem ação",
        description: "Há bairros com sinais suficientes, mas ainda sem ação planejada no ciclo visível.",
        whyItMatters: "Quando o território amadurece e a base não responde, a leitura perde potência operacional.",
        recommendedAction: "Planejar uma escuta, visita ou missão de campo nos territórios que já estão prontos para avançar.",
        href: "/relatorios/territorios",
        count,
      };
    case "pending_memory":
      return {
        type,
        severity: severityByCount(count, 1, 4),
        title: "Memória pendente",
        description: "Há aprendizados ainda em rascunho ou sem fechamento claro.",
        whyItMatters: "Sem memória consolidada, o próximo ciclo repete esforço e perde lastro.",
        recommendedAction: "Fechar os rascunhos e deixar os aprendizados acessíveis para a equipe.",
        href: "/memoria",
        count,
      };
    case "high_team_load":
      return {
        type,
        severity: severityByCount(count, 1, 2),
        title: "Carga alta da equipe",
        description: "Parte da base está operando acima do ritmo saudável.",
        whyItMatters: "Sobrecarga não acelera a base; ela aumenta erro, esquecimento e perda de contexto.",
        recommendedAction: "Redistribuir o trabalho e operar em blocos curtos com pausas combinadas.",
        href: "/dashboard",
        count,
        guardrailNote: "A recomendação aqui é reduzir pressão, não aumentar volume.",
      };
    case "territory_ready":
      return {
        type,
        severity: severityByCount(count, 1, 3),
        title: "Território pronto para ação",
        description: "Há bairros com sinais e preparo suficientes para abrir o próximo movimento.",
        whyItMatters: "Coordenação forte transforma prontidão em ação concreta antes do contexto esfriar.",
        recommendedAction: "Escolher um território pronto e abrir uma ação enxuta com follow-up viável.",
        href: "/relatorios/territorios",
        count,
      };
  }
}

export function buildCycleAlerts(input: CycleAlertEngineInput): CycleAlertEngineItem[] {
  const items: CycleAlertEngineItem[] = [
    buildAlert("urgent_care", input.urgentCare),
    buildAlert("pending_returns", input.pendingReturns),
    buildAlert("unassigned_missions", input.unassignedMissions),
    buildAlert("open_referrals", input.openReferrals),
    buildAlert("field_without_closure", input.fieldWithoutClosure),
    buildAlert("territory_without_action", input.territoryWithoutAction),
    buildAlert("pending_memory", input.pendingMemory),
    buildAlert("high_team_load", input.highTeamLoad),
    buildAlert("territory_ready", input.territoriesReady),
  ];

  const priorityIndex = new Map<RhythmAlertPriorityType, number>(
    RHYTHM_ALERT_PRIORITY.map((item, index) => [item, index]),
  );

  return items
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      const aPriority = priorityIndex.get(a.type as RhythmAlertPriorityType);
      const bPriority = priorityIndex.get(b.type as RhythmAlertPriorityType);

      if (aPriority !== undefined && bPriority !== undefined && aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      const severityWeight = { critical: 2, attention: 1, stable: 0 };
      if (severityWeight[a.severity] !== severityWeight[b.severity]) {
        return severityWeight[b.severity] - severityWeight[a.severity];
      }

      return b.count - a.count;
    });
}
