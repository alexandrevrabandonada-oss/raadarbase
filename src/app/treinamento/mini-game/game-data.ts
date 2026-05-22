export type MissionStep = "copy" | "open" | "personalize" | "send" | "response" | "route";
export type ConsequenceTone = "clear" | "warning" | "guardrail";
export type CorrectionKind = "automation" | "personalization" | "privacy" | "response" | "routing";
export type MissionHoldTone = "free" | "waiting" | "blocked";
export type MissionSupportLevel = "guided" | "assisted" | "operation";

export interface Consequence {
  eyebrow: string;
  label: string;
  message: string;
  tone: ConsequenceTone;
}

export interface MissionHold {
  label: string;
  message: string;
  tone: MissionHoldTone;
}

export interface MissionResult {
  contact: string;
  corrections: number;
  correctionKinds: CorrectionKind[];
  memory: string;
  missionIndex: number;
  response: string;
  route: string;
}

export interface Mission {
  contact: string;
  handle: string;
  source: string;
  channel: "instagram" | "field-note" | "form";
  channelLabel: string;
  supportLevel: MissionSupportLevel;
  supportLabel: string;
  supportMessage: string;
  openActionLabel: string;
  openFeedback: string;
  signal: string;
  objective: string;
  handoffNote: string;
  suggestedMessage: string;
  simulatedReply: string;
  responseOptions: {
    id: string;
    label: string;
    hint: string;
    feedback: string;
    correct: boolean;
  }[];
  routeOptions: {
    id: string;
    label: string;
    hint: string;
    icon: "route" | "wait" | "shield";
    feedback: string;
    correct: boolean;
  }[];
}

export const MISSIONS: Mission[] = [
  {
    contact: "Julia Santos",
    handle: "@julia.retiro",
    source: "Comentario no Instagram",
    channel: "instagram",
    channelLabel: "Instagram",
    supportLevel: "guided",
    supportLabel: "Missao guiada",
    supportMessage: "O fluxo abre cada acao e mostra a ordem completa para voce reconhecer a jornada.",
    openActionLabel: "Abrir Instagram",
    openFeedback: "Instagram aberto em modo de treino. Personalize a mensagem antes de confirmar.",
    signal: "Onibus do Retiro atrasando todo dia. Ninguem aguenta mais.",
    objective: "Transformar um sinal publico em conversa manual e registrada.",
    handoffNote: "Relato aponta atraso recorrente no Retiro por volta das 6h40.",
    suggestedMessage:
      "Oi, Julia. Vi seu comentario sobre os atrasos no Retiro. Estamos juntando relatos para entender onde a linha mais trava. Pode me contar qual horario costuma ser pior?",
    simulatedReply:
      "Oi! Piora por volta das 6h40. Se voces juntarem esses relatos eu topo contar melhor.",
    responseOptions: [
      {
        id: "warm",
        label: "Respondeu bem",
        hint: "A conversa abriu com contexto.",
        correct: true,
        feedback: "Boa leitura. A pessoa abriu conversa e pode entrar na fila de acolhimento.",
      },
      {
        id: "cold",
        label: "Sem retorno",
        hint: "A conversa segue em espera.",
        correct: false,
        feedback: "Ainda cedo para encaminhar. Primeiro aguarde retorno sem duplicar abordagem.",
      },
      {
        id: "blast",
        label: "Disparo automatico",
        hint: "Atalho proibido no Radar.",
        correct: false,
        feedback: "Isso quebra a regra central: abordagem no Radar e manual, contextual e sem spam.",
      },
    ],
    routeOptions: [
      {
        id: "field",
        label: "Missao de Campo",
        hint: "Conectar relato a acao presencial.",
        icon: "route",
        correct: true,
        feedback: "Correto. A conversa virou relato acionavel para a equipe territorial.",
      },
      {
        id: "wait",
        label: "Revisar depois",
        hint: "Segurar a decisao com contexto.",
        icon: "wait",
        correct: false,
        feedback: "Perde ritmo. Ela respondeu e trouxe informacao concreta para a equipe.",
      },
      {
        id: "shield",
        label: "Nao abordar",
        hint: "Fechar por consentimento ou seguranca.",
        icon: "shield",
        correct: false,
        feedback: "Nao houve pedido de privacidade. Use esse status apenas quando a pessoa pedir.",
      },
    ],
  },
  {
    contact: "Marcos Silva",
    handle: "Escuta de rua",
    source: "Praca do Retiro",
    channel: "field-note",
    channelLabel: "Registro de escuta",
    supportLevel: "assisted",
    supportLabel: "Missao assistida",
    supportMessage: "A ordem continua protegida, mas a leitura de privacidade depende da resposta registrada.",
    openActionLabel: "Abrir registro de escuta",
    openFeedback: "Registro da escuta aberto. Personalize o relato antes de confirmar.",
    signal: "Quero registrar a reclamacao da saude, mas nao quero mensagem depois.",
    objective: "Registrar a escuta sem violar privacidade.",
    handoffNote: "Relato de saude registrado sem contato futuro por pedido expresso.",
    suggestedMessage:
      "Obrigado por registrar, Marcos. Vou anotar seu relato sem contato futuro e marcar no sistema que voce nao quer receber novas abordagens.",
    simulatedReply:
      "E isso mesmo. Pode registrar a reclamacao, mas nao quero contato depois.",
    responseOptions: [
      {
        id: "privacy",
        label: "Nao quer contato",
        hint: "A restricao etica precisa ser respeitada.",
        correct: true,
        feedback: "Exato. O pedido da pessoa manda no fluxo, mesmo quando o relato e importante.",
      },
      {
        id: "lead",
        label: "Quer ajudar",
        hint: "Encaminhar apenas com vontade expressa.",
        correct: false,
        feedback: "Ele nao virou lead. Ele trouxe relato e recusou contato futuro.",
      },
      {
        id: "ignore",
        label: "Sem retorno",
        hint: "Use apenas quando falta resposta.",
        correct: false,
        feedback: "O relato precisa existir no diagnostico, mas sem virar abordagem futura.",
      },
    ],
    routeOptions: [
      {
        id: "shield",
        label: "Nao abordar",
        hint: "Fechar por consentimento ou seguranca.",
        icon: "shield",
        correct: true,
        feedback: "Correto. O sistema protege Marcos de novas mensagens e preserva o relato.",
      },
      {
        id: "field",
        label: "Missao de Campo",
        hint: "Conectar pessoa a acao presencial.",
        icon: "route",
        correct: false,
        feedback: "Encaminhar contato aqui desrespeita o pedido dele.",
      },
      {
        id: "wait",
        label: "Revisar depois",
        hint: "Segurar a decisao com contexto.",
        icon: "wait",
        correct: false,
        feedback: "Espera nao resolve privacidade. O status precisa bloquear novas abordagens.",
      },
    ],
  },
  {
    contact: "Carla Menezes",
    handle: "@carla.aterro",
    source: "Formulario do bairro",
    channel: "form",
    channelLabel: "Formulario do bairro",
    supportLevel: "operation",
    supportLabel: "Simulacao operacional",
    supportMessage: "Menos dicas visuais. Leia o retorno, preserve a memoria curta e decida o destino.",
    openActionLabel: "Abrir formulario",
    openFeedback: "Formulario aberto em modo de treino. Personalize a resposta antes de confirmar.",
    signal: "Quero participar do mutirao, mas so posso depois das 18h.",
    objective: "Confirmar interesse, registrar disponibilidade e mover a missao.",
    handoffNote: "Disponibilidade para mutirao confirmada depois das 18h.",
    suggestedMessage:
      "Oi, Carla. Obrigado por se colocar a disposicao. Vou registrar sua disponibilidade depois das 18h e encaminhar para a equipe do mutirao combinar o melhor horario.",
    simulatedReply:
      "Perfeito. Depois das 18h eu consigo ajudar e posso falar com a equipe do mutirao.",
    responseOptions: [
      {
        id: "available",
        label: "Quer ajudar",
        hint: "Encaminhar para voluntariado ou campo.",
        correct: true,
        feedback: "Certo. O dado principal e horario e disponibilidade para coordenacao.",
      },
      {
        id: "spam",
        label: "Pediu informacoes",
        hint: "Registrar duvida e seguir conversa.",
        correct: false,
        feedback: "Agenda longa no primeiro contato cria atrito. Registre o dado e encaminhe.",
      },
      {
        id: "closed",
        label: "Sem retorno",
        hint: "A conversa segue em espera.",
        correct: false,
        feedback: "Sem nota, a equipe perde o contexto que torna o contato util.",
      },
    ],
    routeOptions: [
      {
        id: "field",
        label: "Missao de Campo",
        hint: "Conectar a pessoa a uma acao presencial.",
        icon: "route",
        correct: true,
        feedback: "Perfeito. A equipe recebe pessoa, contexto e janela de horario.",
      },
      {
        id: "wait",
        label: "Revisar depois",
        hint: "Segurar a decisao com contexto.",
        icon: "wait",
        correct: false,
        feedback: "Ela ja ofereceu disponibilidade. Esperar agora reduz chance de vinculo.",
      },
      {
        id: "shield",
        label: "Nao abordar",
        hint: "Fechar por consentimento ou seguranca.",
        icon: "shield",
        correct: false,
        feedback: "Nao houve recusa de contato. Esse status seria incorreto.",
      },
    ],
  },
];

export const STEP_LABELS: Record<MissionStep, string> = {
  copy: "Preparar mensagem",
  open: "Abrir canal",
  personalize: "Personalizar",
  send: "Confirmar envio",
  response: "Registrar resposta",
  route: "Encaminhar missao",
};

export const STEP_ORDER: MissionStep[] = ["copy", "open", "personalize", "send", "response", "route"];
