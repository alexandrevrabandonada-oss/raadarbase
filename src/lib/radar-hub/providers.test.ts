import { afterEach, describe, expect, it } from "vitest";
import { MOCK_INFLUENCE_PROFILES } from "@/lib/influence/mock-data";
import { ConfiguredHttpProvider, CsvProvider, ExistingInstagramProvider, JsonProvider } from "./providers";

describe("radar source providers", () => {
  const previous = process.env.RADAR_ALLOWED_ENRICHMENT_ENDPOINTS;
  afterEach(() => { process.env.RADAR_ALLOWED_ENRICHMENT_ENDPOINTS = previous; });
  it("normaliza CSV e JSON no mesmo contrato", async () => {
    const csv = await new CsvProvider().normalize("nome,username,cidade\nComércio Demo,comercio_demo,Barra Mansa");
    const json = await new JsonProvider().normalize(JSON.stringify([{ name: "Comércio Demo", username: "comercio_demo", city: "Barra Mansa" }]));
    expect(csv[0]).toMatchObject({ displayName: "Comércio Demo", sourceType: "csv" });
    expect(json[0]).toMatchObject({ displayName: "Comércio Demo", sourceType: "json" });
  });
  it("converte a base Instagram existente sem coletar a plataforma", async () => {
    const records = await new ExistingInstagramProvider().normalize(MOCK_INFLUENCE_PROFILES.slice(0, 1));
    expect(records[0]).toMatchObject({ sourceType: "instagram", sourceReference: MOCK_INFLUENCE_PROFILES[0].id });
  });
  it("bloqueia endpoint fora da allowlist", async () => {
    process.env.RADAR_ALLOWED_ENRICHMENT_ENDPOINTS = "";
    const provider = new ConfiguredHttpProvider("https://example.com/enrich");
    await expect(provider.enrich((await new JsonProvider().normalize('[{"name":"Demo"}]'))[0])).rejects.toThrow(/allowlist/);
  });
});
