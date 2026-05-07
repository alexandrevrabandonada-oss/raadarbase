import type { PersonStatus } from "@/lib/types";

export type BoardColumnId =
  | "para_abordar"
  | "mensagem_enviada"
  | "esperando_resposta"
  | "respondeu"
  | "precisa_encaminhar"
  | "convidado"
  | "entrou_na_base"
  | "primeira_acao_feita"
  | "nao_insistir"
  | "nao_abordar";

export const outreachBoardColumns: BoardColumnId[] = [
  "para_abordar",
  "mensagem_enviada",
  "esperando_resposta",
  "respondeu",
  "precisa_encaminhar",
  "convidado",
  "entrou_na_base",
  "primeira_acao_feita",
  "nao_insistir",
  "nao_abordar",
];

export const outreachColumnLabels: Record<BoardColumnId, string> = {
  para_abordar: "Primeiro Contato",
  mensagem_enviada: "Mensagem Enviada",
  esperando_resposta: "Aguardando Retorno",
  respondeu: "Respondeu Bem",
  precisa_encaminhar: "Falta Encaminhamento",
  convidado: "Convidado/Engajado",
  entrou_na_base: "Vínculo Confirmado",
  primeira_acao_feita: "Ação Realizada",
  nao_insistir: "Pausa Operacional",
  nao_abordar: "Retirar de Abordagem",
};

export function normalizeOutreachColumn(column: string | null | undefined): BoardColumnId {
  switch (column) {
    case "novo":
    case "responder_comentario":
    case "mandar_dm_manual":
    case "para_abordar":
      return "para_abordar";
    case "mensagem_enviada":
      return "mensagem_enviada";
    case "aguardando_resposta":
    case "esperando_resposta":
      return "esperando_resposta";
    case "respondeu":
      return "respondeu";
    case "convidar_grupo":
    case "precisa_encaminhar":
      return "precisa_encaminhar";
    case "convidado":
      return "convidado";
    case "contato_confirmado":
    case "entrou_na_base":
      return "entrou_na_base";
    case "primeira_acao_feita":
      return "primeira_acao_feita";
    case "nao_insistir":
      return "nao_insistir";
    case "nao_abordar":
      return "nao_abordar";
    default:
      return "para_abordar";
  }
}

export function getOutreachColumnLabel(column: string | null | undefined) {
  return outreachColumnLabels[normalizeOutreachColumn(column)];
}

export function nextBoardColumn(column: BoardColumnId, direction: -1 | 1) {
  const index = outreachBoardColumns.indexOf(column);
  return outreachBoardColumns[Math.max(0, Math.min(outreachBoardColumns.length - 1, index + direction))];
}

export function mapBoardColumnToPersonStatus(column: BoardColumnId, currentStatus: PersonStatus): PersonStatus {
  switch (column) {
    case "mensagem_enviada":
    case "esperando_resposta":
    case "nao_insistir":
      return "abordado";
    case "respondeu":
    case "precisa_encaminhar":
    case "convidado":
    case "primeira_acao_feita":
      return "respondeu";
    case "entrou_na_base":
      return "contato_confirmado";
    case "nao_abordar":
      return "nao_abordar";
    case "para_abordar":
      return currentStatus === "nao_abordar" ? "novo" : currentStatus === "contato_confirmado" ? "contato_confirmado" : "responder";
    default:
      return currentStatus;
  }
}

export function boardColumnNeedsDoNotContactReason(column: BoardColumnId) {
  return column === "nao_abordar";
}

export function boardColumnCountsAsReferral(column: string | null | undefined) {
  const normalized = normalizeOutreachColumn(column);
  return normalized === "convidado" || normalized === "entrou_na_base" || normalized === "primeira_acao_feita";
}

export function boardColumnIsPendingResponse(column: string | null | undefined) {
  return normalizeOutreachColumn(column) === "esperando_resposta";
}
