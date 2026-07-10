import { describe, expect, it } from "vitest";
import { normalizeUniversalRecord } from "./normalizer";
import { resolveEntityIdentity, type IdentityCandidate } from "./identity";

describe("resolveEntityIdentity", () => {
  const incoming = normalizeUniversalRecord({ name: "Empresa Demo", username: "empresa_demo", city: "Resende", source: "instagram" });
  const candidate = (overrides: Partial<IdentityCandidate> = {}): IdentityCandidate => ({ entityId: "entity-1", entityType: "company", normalizedName: incoming.normalizedName, city: "Resende", identifiers: [], ...overrides });

  it("vincula somente identificador exato", () => expect(resolveEntityIdentity(incoming, [candidate({ identifiers: incoming.identifiers })])).toMatchObject({ action: "link", entityId: "entity-1", confidence: 0.99 }));
  it("sugere, sem mesclar, nomes e cidades coincidentes", () => expect(resolveEntityIdentity(incoming, [candidate()])).toMatchObject({ action: "suggest", candidateId: "entity-1", confidence: 0.88 }));
  it("é mais conservador com homônimos pessoais", () => expect(resolveEntityIdentity({ ...incoming, entityType: "person" }, [candidate({ entityType: "person" })])).toMatchObject({ action: "suggest", confidence: 0.72 }));
  it("cria entidade sem evidência de identidade", () => expect(resolveEntityIdentity(incoming, [candidate({ normalizedName: "outra entidade", city: null })]).action).toBe("create"));
});
