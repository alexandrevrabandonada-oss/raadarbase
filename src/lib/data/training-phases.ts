import { LucideIcon, GraduationCap, User, MessageSquare, HeartHandshake, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { PriorityPerson } from "@/lib/types";

export interface TrainingPhase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  objective: string;
  scenarioId: string;
}

export const TRAINING_PHASES: TrainingPhase[] = [
  {
    id: "fase1",
    title: "Entender o Radar",
    description: "Conheça os princípios da escuta ativa e os guardrails éticos.",
    icon: GraduationCap,
    objective: "Leia os princípios e entenda por que não pedimos votos.",
    scenarioId: "scenario_intro",
  },
  {
    id: "fase2",
    title: "Trabalhar uma pessoa",
    description: "Aprenda a abrir a Ficha Rápida e preparar uma abordagem personalizada.",
    icon: User,
    objective: "Abra a ficha, copie a DM e confirme o envio manual.",
    scenarioId: "scenario_copy_dm",
  },
  {
    id: "fase3",
    title: "Registrar resposta",
    description: "Saiba como classificar o que a pessoa respondeu no Instagram.",
    icon: MessageSquare,
    objective: "Selecione a categoria de resposta que melhor descreve o feedback.",
    scenarioId: "scenario_register_reply",
  },
  {
    id: "fase4",
    title: "Encaminhar com cuidado",
    description: "Direcione interessados para missões ou eventos reais.",
    icon: HeartHandshake,
    objective: "Escolha o encaminhamento correto baseado no desejo da pessoa.",
    scenarioId: "scenario_referral",
  },
  {
    id: "fase5",
    title: "Respeitar Não Abordar",
    description: "Privacidade é absoluta. Aprenda a lidar com restrições.",
    icon: ShieldAlert,
    objective: "Identifique quando uma pessoa pediu para não ser contatada.",
    scenarioId: "scenario_dnc",
  },
  {
    id: "fase6",
    title: "Fechar o dia",
    description: "Revise suas tarefas e entenda o impacto do seu trabalho.",
    icon: CheckCircle2,
    objective: "Verifique se limpou sua fila e revise as pendências críticas.",
    scenarioId: "scenario_wrap_up",
  }
];

export interface TrainingScenario {
  id: string;
  title: string;
  context: string;
  challenge: string;
  person: PriorityPerson;
  steps: {
    id: string;
    label: string;
    type: "action" | "info";
  }[];
}

const basePerson: PriorityPerson = {
  id: "temp",
  username: "user",
  displayName: "User",
  totalInteractions: 1,
  lastInteractionAt: new Date().toISOString(),
  latestInteractionType: "comentario",
  themes: ["geral"],
  status: "novo",
  notes: "",
  doNotContactReason: null,
  syncedAt: new Date().toISOString(),
  responsibleId: null,
  responsibleName: null,
  contact: null,
  mainTheme: "Geral",
  temperature: "morno",
  priorityScore: 50,
  priorityReason: "Comentou um post",
  nextAction: "Preparar DM",
  latestInteractionLabel: "Comentou",
  outreachStatusLabel: "Novo",
  suggestedMessage: "Olá!",
  suggestedTemplateName: "Boas vindas",
  instagramUrl: "https://instagram.com",
  hasPendingTask: true,
  isPendingResponse: false,
  hasReferral: false,
  priorityEligible: true,
  scoreLabel: "Médio",
  scoreIntensity: 50,
  scoreTooltip: "Prioridade padrão",
  riskFlags: {
    noReferralAfterResponse: false,
    recentOutreach: false,
    doNotContact: false
  }
};

export const TRAINING_SCENARIOS_DATA: TrainingScenario[] = [
  {
    id: "scenario_intro",
    title: "Princípios Éticos",
    context: "Você é um novo operador. O Radar identificou um comentário positivo de 'Julia' em um post sobre mobilidade.",
    challenge: "Leia os princípios e aceite o compromisso ético.",
    person: { ...basePerson, id: "p1", username: "julia_mobilidade", displayName: "Julia Santos" },
    steps: [
      { id: "read", label: "Li os princípios éticos", type: "info" },
      { id: "accept", label: "Aceito operar com responsabilidade", type: "action" }
    ]
  },
  {
    id: "scenario_copy_dm",
    title: "Preparando Contato",
    context: "Julia comentou: 'Finalmente alguém falando disso!'. Vamos preparar a DM.",
    challenge: "Copie a mensagem e simule o envio manual.",
    person: { ...basePerson, id: "p1", username: "julia_mobilidade", displayName: "Julia Santos", suggestedMessage: "Olá Julia! Vi seu comentário no post de mobilidade..." },
    steps: [
      { id: "copy", label: "Copiar DM sugerida", type: "action" },
      { id: "confirm", label: "Confirmar envio manual", type: "action" }
    ]
  },
  {
    id: "scenario_register_reply",
    title: "Registrando Resposta",
    context: "Julia respondeu: 'Claro, quero saber mais sobre como posso ajudar!'.",
    challenge: "Registre que ela respondeu bem e quer ajudar.",
    person: { ...basePerson, id: "p1", username: "julia_mobilidade", displayName: "Julia Santos", status: "abordado" },
    steps: [
      { id: "select", label: "Selecionar 'Respondeu Bem / Quer Ajudar'", type: "action" }
    ]
  },
  {
    id: "scenario_referral",
    title: "Fazendo Encaminhamento",
    context: "Como Julia quer ajudar, vamos encaminhá-la para o grupo de voluntários.",
    challenge: "Selecione o encaminhamento para 'Missão ÉLuta'.",
    person: { ...basePerson, id: "p1", username: "julia_mobilidade", displayName: "Julia Santos", status: "respondeu" },
    steps: [
      { id: "refer", label: "Encaminhar para Missão ÉLuta", type: "action" }
    ]
  },
  {
    id: "scenario_dnc",
    title: "Privacidade Absoluta",
    context: "O operador anterior marcou 'Marcos' como Não Abordar pois ele pediu exclusão de dados.",
    challenge: "Tente abrir a ficha e veja o bloqueio ético.",
    person: { ...basePerson, id: "p2", username: "marcos_privado", displayName: "Marcos Silva", status: "nao_abordar", doNotContactReason: "Pediu exclusão de dados" },
    steps: [
      { id: "view", label: "Visualizar restrição", type: "info" }
    ]
  },
  {
    id: "scenario_wrap_up",
    title: "Fechamento do Dia",
    context: "Você processou todos os vínculos prioritários de hoje.",
    challenge: "Confira seu progresso na Missão do Dia.",
    person: { ...basePerson, id: "p1", username: "julia_mobilidade", displayName: "Julia Santos", status: "contato_confirmado" },
    steps: [
      { id: "finish", label: "Concluir jornada de treinamento", type: "action" }
    ]
  }
];
