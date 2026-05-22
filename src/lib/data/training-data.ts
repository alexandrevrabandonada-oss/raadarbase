import { PriorityPerson, PersonStatus } from "@/lib/types";

export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  persona: PriorityPerson;
  steps: TrainingStep[];
}

export interface TrainingStep {
  id: string;
  instruction: string;
  actionRequired: string; // e.g., "copy_dm", "confirm_sent", "register_response", "referral", "do_not_contact"
  targetStatus?: PersonStatus;
  completed: boolean;
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: "sc-1",
    title: "Cenário 1: Pessoa comentou uma denúncia",
    description: "Aprenda a abrir a ficha, preparar a mensagem e confirmar o envio manual.",
    persona: {
      id: "tp-1",
      username: "maria.denuncia",
      displayName: "Maria Silva",
      totalInteractions: 5,
      lastInteractionAt: new Date().toISOString(),
      themes: ["denúncia", "saúde"],
      status: "novo",
      notes: "Comentou em um post reclamando da falta de médicos.",
      doNotContactReason: null,
      syncedAt: null,
      responsibleId: null,
      responsibleName: null,
      contact: null,
      mainTheme: "saúde",
      temperature: "quente",
      priorityScore: 85,
      priorityReason: "Comentário recente de denúncia crítica.",
      nextAction: "Mandar DM para escuta",
      latestInteractionLabel: "Comentário há 2h",
      latestInteractionType: "comentario",
      outreachStatusLabel: "Para Abordar",
      suggestedMessage: "Oi, Maria! Vi seu comentário sobre a falta de médicos. Queremos organizar essas denúncias para cobrar providências. Você autoriza receber um convite para conversar por DM?",
      suggestedTemplateName: "Denúncia Saúde",
      suggestedTemplateId: null,
      instagramUrl: "#",
      hasPendingTask: true,
      isPendingResponse: false,
      hasReferral: false,
      priorityEligible: true,
      scoreLabel: "ALTA",
      scoreIntensity: 85,
      scoreTooltip: "Prioridade alta devido ao teor da denúncia.",
      riskFlags: {
        noReferralAfterResponse: false,
        recentOutreach: false,
        doNotContact: false,
      }
    },
    steps: [
      { id: "s1-1", instruction: "Abra a Ficha Rápida desta pessoa.", actionRequired: "open_sheet", completed: false },
      { id: "s1-2", instruction: "Clique em 'Copiar DM' para preparar a mensagem.", actionRequired: "copy_dm", completed: false },
      { id: "s1-3", instruction: "Confirme que você enviou a mensagem (simule o envio no Instagram).", actionRequired: "confirm_sent", targetStatus: "abordado", completed: false },
    ]
  },
  {
    id: "sc-2",
    title: "Cenário 2: Pessoa quer ajudar",
    description: "Aprenda a registrar uma resposta positiva e encaminhar para a Missão ÉLuta.",
    persona: {
      id: "tp-2",
      username: "jose.voluntario",
      displayName: "José Santos",
      totalInteractions: 12,
      lastInteractionAt: new Date().toISOString(),
      themes: ["ajuda", "mobilização"],
      status: "abordado",
      notes: "Respondeu a DM dizendo que quer ajudar na organização do bairro.",
      doNotContactReason: null,
      syncedAt: null,
      responsibleId: "user-1",
      responsibleName: "Você",
      contact: null,
      mainTheme: "ajuda",
      temperature: "quente",
      priorityScore: 90,
      priorityReason: "Pessoa demonstrou interesse explícito em ajudar.",
      nextAction: "Registrar resposta e encaminhar",
      latestInteractionLabel: "DM enviada há 1 dia",
      latestInteractionType: "dm_manual",
      outreachStatusLabel: "Aguardando Resposta",
      suggestedMessage: null,
      suggestedTemplateName: null,
      suggestedTemplateId: null,
      instagramUrl: "#",
      hasPendingTask: true,
      isPendingResponse: true,
      hasReferral: false,
      priorityEligible: true,
      scoreLabel: "ALTA",
      scoreIntensity: 90,
      scoreTooltip: "Potencial voluntário.",
      riskFlags: {
        noReferralAfterResponse: true,
        recentOutreach: false,
        doNotContact: false,
      }
    },
    steps: [
      { id: "s2-1", instruction: "Clique em 'Registrar Resposta'.", actionRequired: "register_response", completed: false },
      { id: "s2-2", instruction: "Selecione 'Quer entrar no grupo/ajudar' e salve.", actionRequired: "save_response", targetStatus: "respondeu", completed: false },
      { id: "s2-3", instruction: "Agora clique em 'Encaminhar' e escolha 'Missão ÉLuta'.", actionRequired: "referral", completed: false },
    ]
  },
  {
    id: "sc-3",
    title: "Cenário 3: Pessoa quer participar de evento",
    description: "Aprenda a convidar pessoas para eventos presenciais.",
    persona: {
      id: "tp-3",
      username: "ana.evento",
      displayName: "Ana Oliveira",
      totalInteractions: 3,
      lastInteractionAt: new Date().toISOString(),
      themes: ["evento", "presencial"],
      status: "respondeu",
      notes: "Perguntou quando será a próxima reunião.",
      doNotContactReason: null,
      syncedAt: null,
      responsibleId: "user-1",
      responsibleName: "Você",
      contact: null,
      mainTheme: "evento",
      temperature: "morno",
      priorityScore: 70,
      priorityReason: "Interesse em evento presencial.",
      nextAction: "Convidar para evento",
      latestInteractionLabel: "Comentário há 1 dia",
      latestInteractionType: "comentario",
      outreachStatusLabel: "Respondeu Bem",
      suggestedMessage: null,
      suggestedTemplateName: null,
      suggestedTemplateId: null,
      instagramUrl: "#",
      hasPendingTask: true,
      isPendingResponse: false,
      hasReferral: false,
      priorityEligible: true,
      scoreLabel: "MÉDIA",
      scoreIntensity: 70,
      scoreTooltip: "Interesse em atividade offline.",
      riskFlags: {
        noReferralAfterResponse: false,
        recentOutreach: false,
        doNotContact: false,
      }
    },
    steps: [
      { id: "s3-1", instruction: "Clique em 'Encaminhar' na ficha.", actionRequired: "referral", completed: false },
      { id: "s3-2", instruction: "Selecione 'Evento de Campo' e escolha o evento fictício.", actionRequired: "save_referral", completed: false },
    ]
  },
  {
    id: "sc-4",
    title: "Cenário 4: Pessoa pediu para não receber contato",
    description: "Aprenda a respeitar a privacidade e bloquear abordagens.",
    persona: {
      id: "tp-4",
      username: "carlos.irritado",
      displayName: "Carlos Mendes",
      totalInteractions: 1,
      lastInteractionAt: new Date().toISOString(),
      themes: ["privacidade"],
      status: "novo",
      notes: "Respondeu o comentário dizendo 'não me mandem DM, não quero papo'.",
      doNotContactReason: null,
      syncedAt: null,
      responsibleId: null,
      responsibleName: null,
      contact: null,
      mainTheme: "privacidade",
      temperature: "frio",
      priorityScore: 10,
      priorityReason: "Pedido explícito de não contato.",
      nextAction: "Marcar Não Abordar",
      latestInteractionLabel: "Comentário há 10min",
      latestInteractionType: "comentario",
      outreachStatusLabel: "Para Abordar",
      suggestedMessage: "Oi Carlos, desculpe o incômodo. Não entraremos mais em contato.",
      suggestedTemplateName: "Desculpas/Não Abordar",
      suggestedTemplateId: null,
      instagramUrl: "#",
      hasPendingTask: true,
      isPendingResponse: false,
      hasReferral: false,
      priorityEligible: true,
      scoreLabel: "BAIXA",
      scoreIntensity: 10,
      scoreTooltip: "Evitar atrito.",
      riskFlags: {
        noReferralAfterResponse: false,
        recentOutreach: false,
        doNotContact: false,
      }
    },
    steps: [
      { id: "s4-1", instruction: "Abra a ficha e clique no menu de ações (ou botão de bloqueio).", actionRequired: "do_not_contact", completed: false },
      { id: "s4-2", instruction: "Confirme que a pessoa não deve ser abordada.", actionRequired: "confirm_block", targetStatus: "nao_abordar", completed: false },
      { id: "s4-3", instruction: "Verifique se o botão 'Copiar DM' agora está bloqueado.", actionRequired: "verify_blocked", completed: false },
    ]
  }
];
