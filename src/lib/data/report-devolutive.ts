import { sanitizeReportSnapshot } from "@/lib/reports/safety";
import { getMobilizationReport } from "@/lib/data/reports";
import { getActionPlanByReportId } from "@/lib/data/action-plans";

type ReportDevolutiveTopic = {
  topic_id: string;
  topic?: { name?: string } | null;
  interaction_count?: number;
  post_count?: number;
  people_count?: number;
};

type ReportDevolutiveSnapshot = {
  period?: {
    start?: string | null;
    end?: string | null;
  };
  totals?: {
    postsAnalyzed?: number;
    interactionsAnalyzed?: number;
    uniquePeople?: number;
  };
  topTopics?: ReportDevolutiveTopic[];
};

export type PublicDevolutiveCarouselCard = {
  number: number;
  text: string;
};

export type PublicDevolutiveKit = {
  reportId: string;
  reportTitle: string;
  periodStart: string | null;
  periodEnd: string | null;
  publicTitle: string;
  summary: string;
  topics: Array<{ name: string; interactionCount: number; peopleCount: number }>;
  carouselCards: PublicDevolutiveCarouselCard[];
  instagramCaption: string;
  whatsappText: string;
  neighborhoodCall: string;
  methodologyNotice: string;
  planLink: string;
  planId: string | null;
  planTitle: string | null;
  relatedPlanItems: Array<{ id: string; title: string; type: string; status: string }>;
};

function compactTopicNameList(names: string[]) {
  if (names.length === 0) return "as pautas mais recorrentes";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names[0]}, ${names[1]} e ${names.slice(2).join(", ")}`;
}

function buildCaption(topics: Array<{ name: string }>) {
  const topicNames = topics.slice(0, 4).map((topic) => topic.name);
  const topicText = topicNames.length > 0 ? topicNames.join(", ") : "as pautas mais recorrentes";

  return [
    "Chegou a primeira devolutiva pública da nossa escuta no Instagram.",
    "Analisamos interações públicas de forma agregada, sem expor pessoas e sem perfilamento individual.",
    `As pautas que mais apareceram foram ${topicText}.`,
    "Agora queremos ouvir por bairro: comenta o seu bairro e a pauta que precisa virar ação.",
    "Não envie dados pessoais no comentário.",
    "Escuta pública por pauta, não perfilamento individual.",
    "#MissaoELuta #VRAbandonada #EscutaPublica #Saude #Transporte",
  ].join("\n\n");
}

function buildWhatsappMessage(topics: Array<{ name: string }>) {
  const topicNames = topics.slice(0, 4).map((topic) => topic.name);
  const topicText = compactTopicNameList(topicNames);

  return [
    "Primeira devolutiva pública da escuta do Instagram.",
    `As pautas mais recorrentes foram ${topicText}.`,
    "Se quiser contribuir, responda com bairro + pauta.",
    "Por favor, não envie dados pessoais sensíveis no grupo.",
    "Se o tema for coletivo, ele entra na próxima rodada de escuta e devolutiva pública.",
    "Escuta pública por pauta, não perfilamento individual.",
  ].join("\n");
}

function buildMarkdown(kit: PublicDevolutiveKit) {
  const topicsMarkdown = kit.topics
    .map((topic) => `- **${topic.name}**: ${topic.interactionCount} interações públicas, ${topic.peopleCount} pessoas públicas`)
    .join("\n");

  const cardsMarkdown = kit.carouselCards
    .map((card) => `${card.number}. ${card.text}`)
    .join("\n");

  const planSection = kit.planId
    ? `Plano de ação: [${kit.planTitle ?? "abrir plano"}](/acoes/${kit.planId})`
    : "Plano de ação: nenhum plano vinculado encontrado.";

  return [
    `# ${kit.publicTitle}`,
    "",
    `**Relatório base:** ${kit.reportTitle}`,
    `**Período:** ${kit.periodStart ?? "-"} a ${kit.periodEnd ?? "-"}`,
    "",
    `## Resumo`,
    kit.summary,
    "",
    "## Tópicos principais",
    topicsMarkdown || "- Nenhum tópico destacado.",
    "",
    "## Carrossel 1:1",
    cardsMarkdown,
    "",
    "## Legenda Instagram",
    kit.instagramCaption,
    "",
    "## Texto para WhatsApp",
    kit.whatsappText,
    "",
    "## Chamada para escuta de bairro",
    kit.neighborhoodCall,
    "",
    "## Aviso de metodologia",
    kit.methodologyNotice,
    "",
    `## ${planSection}`,
    "",
    "Escuta pública por pauta, não perfilamento individual.",
  ].join("\n");
}

function buildHtml(kit: PublicDevolutiveKit) {
  const topicItems = kit.topics
    .map((topic) => `<li><strong>${topic.name}</strong>: ${topic.interactionCount} interações públicas, ${topic.peopleCount} pessoas públicas</li>`)
    .join("");
  const cardItems = kit.carouselCards
    .map((card) => `<li><strong>Card ${card.number}.</strong> ${card.text}</li>`)
    .join("");
  const planLink = kit.planId
    ? `<a href="/acoes/${kit.planId}">${kit.planTitle ?? "Abrir plano de ação"}</a>`
    : "Nenhum plano vinculado encontrado.";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${kit.publicTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 980px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
        h1 { border-bottom: 2px solid #111827; padding-bottom: 12px; }
        h2 { margin-top: 28px; }
        .meta { color: #6b7280; margin-bottom: 20px; }
        .panel { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-top: 14px; background: #fff; }
        .warning { background: #f8fafc; border-left: 4px solid #0f172a; padding: 12px 16px; margin: 14px 0; }
        ul { padding-left: 20px; }
      </style>
    </head>
    <body>
      <h1>${kit.publicTitle}</h1>
      <div class="meta">${kit.reportTitle} | ${kit.periodStart ?? "-"} a ${kit.periodEnd ?? "-"}</div>
      <div class="warning">${kit.summary}</div>
      <div class="panel">
        <h2>Tópicos principais</h2>
        <ul>${topicItems || "<li>Nenhum tópico destacado.</li>"}</ul>
      </div>
      <div class="panel">
        <h2>Carrossel 1:1</h2>
        <ol>${cardItems}</ol>
      </div>
      <div class="panel"><h2>Legenda Instagram</h2><p>${kit.instagramCaption.replace(/\n/g, "<br>")}</p></div>
      <div class="panel"><h2>Texto para WhatsApp</h2><p>${kit.whatsappText.replace(/\n/g, "<br>")}</p></div>
      <div class="panel"><h2>Chamada para escuta de bairro</h2><p>${kit.neighborhoodCall.replace(/\n/g, "<br>")}</p></div>
      <div class="panel"><h2>Aviso de metodologia</h2><p>${kit.methodologyNotice}</p></div>
      <div class="panel"><h2>Plano de ação</h2><p>${planLink}</p></div>
      <div class="panel"><strong>Escuta pública por pauta, não perfilamento individual.</strong></div>
    </body>
    </html>
  `;
}

export async function getPublicDevolutiveKit(reportId: string): Promise<PublicDevolutiveKit> {
  const report = await getMobilizationReport(reportId);
  if (!report) throw new Error("Relatório não encontrado.");

  const snapshot = sanitizeReportSnapshot((report.snapshot as ReportDevolutiveSnapshot) ?? {}) as ReportDevolutiveSnapshot;
  const topTopics = snapshot.topTopics?.length ? snapshot.topTopics : report.topics ?? [];
  const topics = topTopics
    .map((topic) => ({
      name: topic.topic?.name ?? topic.topic_id,
      interactionCount: topic.interaction_count ?? 0,
      peopleCount: topic.people_count ?? 0,
    }))
    .slice(0, 4);

  const plan = await getActionPlanByReportId(reportId);
  const summary = [
    `Analisamos ${snapshot.totals?.postsAnalyzed ?? 0} posts, ${snapshot.totals?.interactionsAnalyzed ?? 0} interações e ${snapshot.totals?.uniquePeople ?? 0} pessoas públicas.`,
    `As pautas mais recorrentes ficaram concentradas em ${compactTopicNameList(topics.map((topic) => topic.name))}.`,
    "Este kit transforma a escuta em devolutiva pública, sem expor pessoas e sem perfilamento individual.",
  ].join(" ");

  return {
    reportId,
    reportTitle: report.title,
    periodStart: snapshot.period?.start ?? report.period_start ?? null,
    periodEnd: snapshot.period?.end ?? report.period_end ?? null,
    publicTitle: "Devolutiva pública da escuta do Instagram",
    summary,
    topics,
    carouselCards: [
      { number: 1, text: "O que apareceu na escuta do Instagram?" },
      { number: 2, text: "Saúde apareceu como uma das maiores preocupações" },
      { number: 3, text: "Transporte e tarifa seguem como dor cotidiana" },
      { number: 4, text: "CSN, poluição e cidade continuam atravessando a vida real" },
      { number: 5, text: "Denúncias e relatos mostram falta de resposta pública" },
      { number: 6, text: "Isso não é perfilamento: é escuta por pauta" },
      { number: 7, text: "Agora queremos ouvir por bairro: qual problema precisa virar ação?" },
    ],
    instagramCaption: buildCaption(topics),
    whatsappText: buildWhatsappMessage(topics),
    neighborhoodCall: "Abra a escuta por bairro com o formulário em /escuta/bairro. Informe somente o necessário para a pauta coletiva e lembre que o contato é opcional, respeitando o consentimento explícito.",
    methodologyNotice: "Escuta pública por pauta, não perfilamento individual. Os comentários usados aqui são agregados e sanitizados/anônimos.",
    planLink: plan ? `/acoes/${plan.id}` : "/acoes",
    planId: plan?.id ?? null,
    planTitle: plan?.title ?? null,
    relatedPlanItems: plan?.items?.map((item) => ({ id: item.id, title: item.title, type: item.type, status: item.status })) ?? [],
  };
}

export function renderPublicDevolutiveMarkdown(kit: PublicDevolutiveKit) {
  return buildMarkdown(kit);
}

export function renderPublicDevolutiveHtml(kit: PublicDevolutiveKit) {
  return buildHtml(kit);
}