import { describe, it, expect } from "vitest";
import { suggestTopicsForText } from "./rules";

describe("Topic Rules", () => {
  it("should suggest transporte for keywords like 'ônibus' or 'tarifa'", () => {
    const text = "O preço da tarifa do ônibus está muito alto no ponto.";
    const suggestions = suggestTopicsForText(text);
    expect(suggestions).toContainEqual(expect.objectContaining({ slug: "transporte" }));
  });

  it("should suggest saude for keywords like 'hospital' or 'UPA'", () => {
    const text = "Fui na UPA e no hospital e o atendimento do SUS foi lento.";
    const suggestions = suggestTopicsForText(text);
    expect(suggestions).toContainEqual(expect.objectContaining({ slug: "saude" }));
  });

  it("should suggest csn and poluicao for usina and pó preto", () => {
    const text = "A CSN está soltando muito pó preto hoje na usina.";
    const suggestions = suggestTopicsForText(text);
    const slugs = suggestions.map(s => s.slug);
    expect(slugs).toContain("csn");
    expect(slugs).toContain("poluicao");
  });

  it("should suggest bairro for specific locations", () => {
    const text = "Minha rua no bairro Aterrado está cheia de buracos.";
    const suggestions = suggestTopicsForText(text);
    expect(suggestions).toContainEqual(expect.objectContaining({ slug: "bairro" }));
  });

  it("should suggest educacao for schools", () => {
    const text = "A creche e a escola precisam de mais merenda para os estudantes.";
    const suggestions = suggestTopicsForText(text);
    expect(suggestions).toContainEqual(expect.objectContaining({ slug: "educacao" }));
  });

  it("should return empty array for empty or null text", () => {
    expect(suggestTopicsForText("")).toEqual([]);
    expect(suggestTopicsForText(null)).toEqual([]);
  });

  it("should return empty array for text without keywords", () => {
    expect(suggestTopicsForText("Bom dia, como vai você?")).toEqual([]);
  });

  it("should not return forbidden labels (negative test of existing rules)", () => {
    const text = "Vou votar em você porque sou de direita e rico.";
    const suggestions = suggestTopicsForText(text);
    const slugs = suggestions.map(s => s.slug);
    // None of the rules should match political orientation or income
    expect(slugs).not.toContain("voto_certo");
    expect(slugs).not.toContain("renda");
    expect(slugs).not.toContain("ideologia");
  });
});
