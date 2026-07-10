import { describe, expect, it } from "vitest";
import { inferLocation } from "./location";

describe("inferLocation", () => {
  it("atribui cidade apenas com evidência", () => {
    expect(inferLocation({ bio: "Professora em Volta Redonda/RJ" })).toMatchObject({ cidade: "Volta Redonda", estado: "RJ", confidence: 0.9 });
  });

  it("não inventa localização sem evidência", () => {
    expect(inferLocation({ bio: "Perfil pessoal" })).toEqual({ cidade: null, estado: null, confidence: 0, evidence: [] });
  });

  it("não escolhe quando há evidências conflitantes equivalentes", () => {
    expect(inferLocation({ bio: "Volta Redonda", site: "https://example.com/barra-mansa-rj" }).cidade).toBeNull();
  });
});

