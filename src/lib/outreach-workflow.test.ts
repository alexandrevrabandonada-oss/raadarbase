import { describe, expect, it } from "vitest";
import {
  boardColumnCountsAsReferral,
  boardColumnIsPendingResponse,
  mapBoardColumnToPersonStatus,
  normalizeOutreachColumn,
  outreachBoardColumns,
} from "./outreach-workflow";

describe("outreach workflow", () => {
  it("normaliza colunas legadas para o quadro atual", () => {
    expect(normalizeOutreachColumn("responder_comentario")).toBe("para_abordar");
    expect(normalizeOutreachColumn("mandar_dm_manual")).toBe("para_abordar");
    expect(normalizeOutreachColumn("aguardando_resposta")).toBe("esperando_resposta");
    expect(normalizeOutreachColumn("convidar_grupo")).toBe("precisa_encaminhar");
    expect(normalizeOutreachColumn("contato_confirmado")).toBe("entrou_na_base");
  });

  it("mapeia colunas para status coerente da pessoa", () => {
    expect(mapBoardColumnToPersonStatus("mensagem_enviada", "novo")).toBe("abordado");
    expect(mapBoardColumnToPersonStatus("respondeu", "abordado")).toBe("respondeu");
    expect(mapBoardColumnToPersonStatus("entrou_na_base", "respondeu")).toBe("contato_confirmado");
    expect(mapBoardColumnToPersonStatus("nao_abordar", "respondeu")).toBe("nao_abordar");
  });

  it("identifica colunas de encaminhamento e resposta pendente", () => {
    expect(boardColumnCountsAsReferral("convidado")).toBe(true);
    expect(boardColumnCountsAsReferral("precisa_encaminhar")).toBe(false);
    expect(boardColumnIsPendingResponse("esperando_resposta")).toBe(true);
  });

  it("mantem as 10 colunas operacionais no quadro", () => {
    expect(outreachBoardColumns).toHaveLength(10);
  });
});
