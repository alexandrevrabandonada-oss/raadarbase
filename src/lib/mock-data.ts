import type {
  IgInteraction,
  IgPerson,
  IgPost,
  KanbanColumnId,
  MessageTemplate,
  OutreachTask,
  PersonStatus,
} from "@/lib/types";

export const statusLabels: Record<PersonStatus, string> = {
  novo: "Novo",
  responder: "Responder",
  abordado: "Abordado",
  respondeu: "Respondeu",
  contato_confirmado: "Contato confirmado",
  nao_abordar: "Não abordar",
};

export const kanbanLabels: Record<KanbanColumnId, string> = {
  novo: "Novo",
  responder_comentario: "Responder comentário",
  mandar_dm_manual: "Mandar DM manual",
  aguardando_resposta: "Aguardando resposta",
  convidar_grupo: "Convidar para grupo",
  contato_confirmado: "Contato confirmado",
  nao_abordar: "Não abordar",
};

export const posts: IgPost[] = [
  {
    id: "post-1",
    shortcode: "VR001",
    caption: "Mutirão pela praça do bairro Vila Rica",
    publishedAt: "2026-04-20",
    interactions: 386,
    comments: 112,
    mobilizationScore: 94,
    topic: "mutirão",
  },
  {
    id: "post-2",
    shortcode: "VR002",
    caption: "Relato dos moradores sobre iluminação pública",
    publishedAt: "2026-04-21",
    interactions: 291,
    comments: 86,
    mobilizationScore: 88,
    topic: "iluminação",
  },
  {
    id: "post-3",
    shortcode: "VR003",
    caption: "Ônibus atrasado de novo: escuta no ponto",
    publishedAt: "2026-04-22",
    interactions: 248,
    comments: 73,
    mobilizationScore: 81,
    topic: "transporte",
  },
  {
    id: "post-4",
    shortcode: "VR004",
    caption: "Chamada para reunião aberta de domingo",
    publishedAt: "2026-04-24",
    interactions: 219,
    comments: 61,
    mobilizationScore: 79,
    topic: "reunião",
  },
];

export const people: IgPerson[] = [
  {
    id: "p-ana",
    username: "ana.vr",
    displayName: "Ana Souza",
    totalInteractions: 18,
    lastInteractionAt: "2026-04-25T15:20:00-03:00",
    themes: ["mutirão", "praça"],
    status: "responder",
    notes: "Comentou que pode ajudar no sábado pela manhã.",
    doNotContactReason: null,
    syncedAt: null,
    contact: null,
  },
  {
    id: "p-joao",
    username: "joaopedreiro",
    displayName: "João Martins",
    totalInteractions: 14,
    lastInteractionAt: "2026-04-25T11:40:00-03:00",
    themes: ["iluminação", "rua"],
    status: "abordado",
    notes: "DM manual enviada sobre reunião de iluminação.",
    doNotContactReason: null,
    syncedAt: null,
    contact: null,
  },
  {
    id: "p-lu",
    username: "lu.da.vila",
    displayName: "Lu Pereira",
    totalInteractions: 22,
    lastInteractionAt: "2026-04-24T19:08:00-03:00",
    themes: ["transporte", "escuta"],
    status: "respondeu",
    notes: "Respondeu positivamente, pedir consentimento para lista.",
    doNotContactReason: null,
    syncedAt: null,
    contact: null,
  },
  {
    id: "p-cida",
    username: "cida_comunidade",
    displayName: "Cida Oliveira",
    totalInteractions: 31,
    lastInteractionAt: "2026-04-23T20:13:00-03:00",
    themes: ["reunião", "saúde"],
    status: "contato_confirmado",
    notes: "Autorizou contato direto para agenda de reuniões.",
    doNotContactReason: null,
    syncedAt: null,
    contact: {
      id: "c-cida",
      person_id: "p-cida",
      contact_channel: "WhatsApp",
      contact_value: null,
      phone: null,
      email: null,
      consent_given: true,
      consent_purpose: "Convites de reuniões comunitárias da VR Abandonada",
      consent_recorded_at: "2026-04-23T20:45:00-03:00",
      consent_status: "confirmed",
      privacy_policy_url: null,
      source: "instagram_manual",
      last_contacted_at: "2026-04-23T20:45:00-03:00",
      created_at: "2026-04-23T20:45:00-03:00",
      updated_at: "2026-04-23T20:45:00-03:00",
    },
  },
  {
    id: "p-marco",
    username: "marco_vr",
    displayName: "Marco Alves",
    totalInteractions: 3,
    lastInteractionAt: "2026-04-22T09:30:00-03:00",
    themes: ["buraco", "rua"],
    status: "novo",
    notes: "Novo perfil recorrente nos comentários.",
    doNotContactReason: null,
    syncedAt: null,
    contact: null,
  },
  {
    id: "p-nina",
    username: "nina.artes",
    displayName: "Nina Costa",
    totalInteractions: 7,
    lastInteractionAt: "2026-04-20T18:10:00-03:00",
    themes: ["cultura", "juventude"],
    status: "nao_abordar",
    notes: "Pediu para não receber contato direto.",
    doNotContactReason: "Pediu para não receber contato direto.",
    syncedAt: null,
    contact: null,
  },
];

export const interactions: IgInteraction[] = [
  {
    id: "i-1",
    personId: "p-ana",
    postId: "post-1",
    type: "comentario",
    occurredAt: "2026-04-25T15:20:00-03:00",
    text: "Se tiver mutirão no sábado eu ajudo a chamar o pessoal da rua 3.",
    theme: "mutirão",
    post: {
      id: "post-1",
      caption: "Mutirão pela praça do bairro Vila Rica",
      shortcode: "VR001",
    },
  },
  {
    id: "i-2",
    personId: "p-ana",
    postId: "post-4",
    type: "curtida",
    occurredAt: "2026-04-24T19:00:00-03:00",
    text: "Curtiu o post da reunião aberta.",
    theme: "reunião",
    post: {
      id: "post-4",
      caption: "Chamada para reunião aberta de domingo",
      shortcode: "VR004",
    },
  },
  {
    id: "i-3",
    personId: "p-joao",
    postId: "post-2",
    type: "comentario",
    occurredAt: "2026-04-25T11:40:00-03:00",
    text: "Essa esquina está escura faz meses. Já teve queda ali.",
    theme: "iluminação",
    post: {
      id: "post-2",
      caption: "Relato dos moradores sobre iluminação pública",
      shortcode: "VR002",
    },
  },
  {
    id: "i-4",
    personId: "p-lu",
    postId: "post-3",
    type: "comentario",
    occurredAt: "2026-04-24T19:08:00-03:00",
    text: "Posso contar os horários que o ônibus some no fim da tarde.",
    theme: "transporte",
    post: {
      id: "post-3",
      caption: "Ônibus atrasado de novo: escuta no ponto",
      shortcode: "VR003",
    },
  },
  {
    id: "i-5",
    personId: "p-cida",
    postId: "post-4",
    type: "dm_manual",
    occurredAt: "2026-04-23T20:45:00-03:00",
    text: "Consentimento registrado para contato direto.",
    theme: "reunião",
    post: {
      id: "post-4",
      caption: "Chamada para reunião aberta de domingo",
      shortcode: "VR004",
    },
  },
  {
    id: "i-6",
    personId: "p-marco",
    postId: "post-1",
    type: "comentario",
    occurredAt: "2026-04-22T09:30:00-03:00",
    text: "Tem buraco perto da escola também.",
    theme: "rua",
    post: {
      id: "post-1",
      caption: "Mutirão pela praça do bairro Vila Rica",
      shortcode: "VR001",
    },
  },
];

export const outreachTasks: OutreachTask[] = [
  { id: "t-1", personId: "p-marco", column: "novo", title: "Entender demanda da rua", notes: "", dueAt: null, completedAt: null, person: { id: "p-marco", username: "marco_vr", status: "novo" } },
  { id: "t-2", personId: "p-ana", column: "responder_comentario", title: "Responder sobre mutirão", notes: "", dueAt: null, completedAt: null, person: { id: "p-ana", username: "ana.vr", status: "responder" } },
  { id: "t-3", personId: "p-joao", column: "mandar_dm_manual", title: "Perguntar ponto exato", notes: "", dueAt: null, completedAt: null, person: { id: "p-joao", username: "joaopedreiro", status: "abordado" } },
  { id: "t-4", personId: "p-lu", column: "convidar_grupo", title: "Pedir consentimento para grupo", notes: "", dueAt: null, completedAt: null, person: { id: "p-lu", username: "lu.da.vila", status: "respondeu" } },
  { id: "t-5", personId: "p-cida", column: "contato_confirmado", title: "Adicionar na lista confirmada", notes: "", dueAt: null, completedAt: null, person: { id: "p-cida", username: "cida_comunidade", status: "contato_confirmado" } },
  { id: "t-6", personId: "p-nina", column: "nao_abordar", title: "Respeitar pedido de privacidade", notes: "", dueAt: null, completedAt: null, person: { id: "p-nina", username: "nina.artes", status: "nao_abordar" } },
];

export const messageTemplates: MessageTemplate[] = [
  {
    id: "m-1",
    name: "Responder comentário",
    theme: "escuta",
    body: "Oi, @{username}! Vi seu comentário sobre {tema}. Obrigado por trazer isso. Se puder, manda mais detalhes por DM para organizarmos essa escuta com cuidado.",
    active: true,
    updatedAt: "2026-04-24",
  },
  {
    id: "m-2",
    name: "Convidar para grupo",
    theme: "grupo",
    body: "Oi, @{username}! A gente está organizando um grupo para avisos e reuniões da comunidade. Você autoriza receber esse convite? Link: {link_grupo}",
    active: true,
    updatedAt: "2026-04-23",
  },
  {
    id: "m-3",
    name: "Formulário de escuta",
    theme: "formulário",
    body: "Oi, @{username}. Para registrar melhor a demanda sobre {tema}, pode preencher este formulário? {link_formulario}. É opcional e usado só para organização comunitária.",
    active: true,
    updatedAt: "2026-04-22",
  },
];

export const interactionsByDay = [
  { day: "20/04", interacoes: 120 },
  { day: "21/04", interacoes: 168 },
  { day: "22/04", interacoes: 141 },
  { day: "23/04", interacoes: 204 },
  { day: "24/04", interacoes: 238 },
  { day: "25/04", interacoes: 191 },
];

export function getPerson(id: string) {
  return people.find((person) => person.id === id);
}

export function getPersonInteractions(personId: string) {
  return interactions
    .filter((interaction) => interaction.personId === personId)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

export function formatDateTime(value: string) {
  if (!value) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
