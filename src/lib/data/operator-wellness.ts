/**
 * Guardrails de Bem-Estar Operacional
 * 
 * Previne fadiga, pressão excessiva e gamificação opressiva.
 * Mantém a motivação sem sacrificar o bem-estar.
 */

export type WellnessLevel = "healthy" | "warning" | "critical";

export interface WellnessCheck {
  level: WellnessLevel;
  taskCount: number;
  recommendation: string;
  shouldSuggestBreak: boolean;
  microcopy: string;
}

const HEALTHY_QUEUE_SIZE = 5;
const WARNING_QUEUE_SIZE = 10;
const CRITICAL_QUEUE_SIZE = 15;

/**
 * Avalia o bem-estar do operador baseado na quantidade de tarefas
 */
export function assessQueueWellness(taskCount: number): WellnessCheck {
  if (taskCount <= HEALTHY_QUEUE_SIZE) {
    return {
      level: "healthy",
      taskCount,
      recommendation: "Foque nessas pessoas. Qualidade sobre quantidade.",
      shouldSuggestBreak: false,
      microcopy: "Seu ritmo está ótimo! Trabalhe no seu tempo.",
    };
  }

  if (taskCount <= WARNING_QUEUE_SIZE) {
    return {
      level: "warning",
      taskCount,
      recommendation: "Você tem muitas pessoas aqui. Considere priorizar as 5 mais quentes.",
      shouldSuggestBreak: false,
      microcopy: "Priorize as mais quentes. Não precisa resolver tudo de uma vez.",
    };
  }

  // Crítico: taskCount > WARNING_QUEUE_SIZE (tipicamente > 10)
  if (taskCount >= CRITICAL_QUEUE_SIZE) {
    return {
      level: "critical",
      taskCount,
      recommendation: "Muitas pendências. Trabalhe em blocos de 5-10. Pause entre blocos.",
      shouldSuggestBreak: true,
      microcopy: "Qualidade vale mais que volume. Trabalhe em blocos curtos.",
    };
  }

  // Fallback: também crítico, mas abaixo do threshold
  return {
    level: "critical",
    taskCount,
    recommendation: "Muitas pendências. Trabalhe em blocos de 5-10. Pause entre blocos.",
    shouldSuggestBreak: true,
    microcopy: "Qualidade vale mais que volume. Trabalhe em blocos curtos.",
  };
}

export const WELLNESS_MICROCOPY = [
  "Qualidade vale mais que volume.",
  "Silêncio também é resposta.",
  "Não abordar também é cuidado.",
  "Fechar bem é melhor que correr.",
  "Pausa também é produtividade.",
  "Uma pessoa bem atendida vale mais que dez apressadas.",
  "Cuidado com si mesmo é cuidado com a base.",
  "O ritmo que sustenta é melhor que o ritmo que queima.",
  "Cada pausa é um investimento na qualidade.",
  "Pessoas cansadas cometem erros. Descansa.",
];

export const MISSION_MESSAGES = {
  starting: {
    title: "Dia em andamento",
    objective: "Trabalhe no seu ritmo. Qualidade é o objetivo.",
  },
  with_pending: {
    title: "Pendências identificadas",
    objective: "Organize-se. Nem tudo precisa ser feito agora.",
  },
  good_progress: {
    title: "Progresso constante",
    objective: "Mantenha o ritmo sem pressão.",
  },
  needs_rest: {
    title: "Tempo de parar",
    objective: "Você fez um bom trabalho. Descansa um pouco.",
  },
  day_closing: {
    title: "Fechamento tranquilo",
    objective: "Organize as pendências para amanhã.",
  },
};

export const COMPLETION_MESSAGES = {
  person_responded: {
    title: "Resposta registrada ✓",
    message: "Obrigado por cuidar desse contato.",
    tone: "calm" as const,
  },
  person_referred: {
    title: "Encaminhamento realizado",
    message: "Essa pessoa vai receber o suporte que precisa.",
    tone: "calm" as const,
  },
  do_not_contact: {
    title: "Decisão respeitosa",
    message: "Respeitar o 'não' também é cuidado.",
    tone: "calm" as const,
  },
  many_completed_today: {
    title: "Pausa bem-vinda",
    message: "Você trabalhou bastante. Considere pausar aqui.",
    tone: "gentle" as const,
  },
};

export function getHourlyWellnessMessage(): string {
  const hour = new Date().getHours();

  if (hour < 9) {
    return "Boa manhã! Comece devagar.";
  }

  if (hour < 12) {
    return "Ritmo bom. Você está aqui?";
  }

  if (hour === 12) {
    return "Hora de comer algo! 🍽️";
  }

  if (hour < 15) {
    return "Tarde. Se precisar pausar, tá tudo bem.";
  }

  if (hour < 17) {
    return "Reta final. Qualidade até o fim.";
  }

  return "Dia cheio! Ótimo trabalho.";
}

export function shouldRecommendBreak(
  taskCount: number,
  completedToday: number,
  hoursWorked: number
): boolean {
  // Recomenda pausa se:
  // 1. Muitas tarefas pendentes (+ de 10)
  if (taskCount > WARNING_QUEUE_SIZE) return true;

  // 2. Completou muitas hoje (+ de 15)
  if (completedToday > 15) return true;

  // 3. Trabalhou + de 6 horas direto
  if (hoursWorked > 6) return true;

  return false;
}

export function getRandomMicrocopy(): string {
  return WELLNESS_MICROCOPY[Math.floor(Math.random() * WELLNESS_MICROCOPY.length)];
}
