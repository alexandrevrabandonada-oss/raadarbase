import { describe, expect, it } from "vitest";
import { parseImportContent } from "./import";

describe("parseImportContent", () => {
  it("lê CSV com aspas, vírgulas e aliases", () => {
    const rows = parseImportContent('username,nome,bio\r\nperfil.demo,"Nome, Demo","Professor em Resende RJ"', "csv");
    expect(rows).toEqual([{ username: "perfil.demo", nome: "Nome, Demo", bio: "Professor em Resende RJ" }]);
  });

  it("lê JSON no envelope profiles", () => {
    expect(parseImportContent('{"profiles":[{"username":"demo"}]}', "json")).toEqual([{ username: "demo" }]);
  });

  it("rejeita JSON fora do contrato", () => {
    expect(() => parseImportContent('{"username":"demo"}', "json")).toThrow(/array de perfis/i);
  });
});

