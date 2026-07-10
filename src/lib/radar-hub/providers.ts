import { parseImportContent } from "@/lib/influence/import";
import type { InfluenceProfile } from "@/lib/influence/types";
import { normalizeUniversalRecord, type UniversalRecordInput } from "@/lib/radar-hub/normalizer";
import type { NormalizedSourceRecord, RadarSourceType } from "@/lib/radar-hub/types";

export type ValidationResult = { valid: boolean; errors: string[] };
export type EnrichmentResult = { record: NormalizedSourceRecord; provider: string; enrichedAt: string };
export type ProviderHealth = { status: "healthy" | "degraded" | "unavailable" | "not_configured"; message: string; checkedAt: string };

export interface RadarSourceProvider {
  sourceType: string;
  displayName: string;
  enabled(): boolean;
  validateInput(input: unknown): Promise<ValidationResult>;
  normalize(input: unknown): Promise<NormalizedSourceRecord[]>;
  enrich?(record: NormalizedSourceRecord): Promise<EnrichmentResult>;
  healthCheck?(): Promise<ProviderHealth>;
}

function records(input: unknown): UniversalRecordInput[] {
  if (Array.isArray(input)) return input.filter((item): item is UniversalRecordInput => Boolean(item && typeof item === "object" && !Array.isArray(item)));
  return input && typeof input === "object" && !Array.isArray(input) ? [input as UniversalRecordInput] : [];
}

abstract class LocalProvider implements RadarSourceProvider {
  abstract sourceType: RadarSourceType;
  abstract displayName: string;
  enabled() { return true; }
  async validateInput(input: unknown): Promise<ValidationResult> {
    const items = records(input);
    return { valid: items.length > 0, errors: items.length ? [] : ["Nenhum registro válido encontrado."] };
  }
  async normalize(input: unknown) {
    const validation = await this.validateInput(input);
    if (!validation.valid) throw new Error(validation.errors.join(" "));
    return records(input).map((item) => normalizeUniversalRecord(item, this.sourceType));
  }
}

export class ManualProvider extends LocalProvider {
  sourceType = "manual" as const;
  displayName = "Entrada manual";
}

export class CsvProvider extends LocalProvider {
  sourceType = "csv" as const;
  displayName = "Arquivo CSV";
  async validateInput(input: unknown) { return { valid: typeof input === "string" && input.trim().length > 0, errors: typeof input === "string" && input.trim() ? [] : ["CSV vazio ou inválido."] }; }
  async normalize(input: unknown) {
    if (typeof input !== "string") throw new Error("CSV deve ser texto.");
    return parseImportContent(input, "csv").map((item) => normalizeUniversalRecord(item, this.sourceType));
  }
}

export class JsonProvider extends LocalProvider {
  sourceType = "json" as const;
  displayName = "Arquivo JSON";
  async validateInput(input: unknown) { return { valid: typeof input === "string" && input.trim().length > 0, errors: typeof input === "string" && input.trim() ? [] : ["JSON vazio ou inválido."] }; }
  async normalize(input: unknown) {
    if (typeof input !== "string") throw new Error("JSON deve ser texto.");
    return parseImportContent(input, "json").map((item) => normalizeUniversalRecord(item, this.sourceType));
  }
}

export class ExistingInstagramProvider implements RadarSourceProvider {
  sourceType = "instagram";
  displayName = "Instagram existente (Tijolo 55)";
  enabled() { return true; }
  async validateInput(input: unknown) { return { valid: Array.isArray(input), errors: Array.isArray(input) ? [] : ["Lista de perfis Instagram inválida."] }; }
  async normalize(input: unknown) {
    if (!Array.isArray(input)) throw new Error("Lista de perfis Instagram inválida.");
    return (input as InfluenceProfile[]).map((profile) => normalizeUniversalRecord({
      entityType: profile.empresa ? "company" : profile.criador ? "digital_profile" : "person",
      name: profile.nome ?? `@${profile.username}`,
      username: profile.username,
      source: "instagram",
      sourceReference: profile.id,
      url: profile.site,
      bio: profile.bio,
      city: profile.cidade,
      state: profile.estado,
      followers: profile.seguidores,
      legacyInfluenceScore: profile.influence_score,
      category: profile.categoria === "politico" ? "politica_institucional" : profile.categoria === "ambientalista" ? "ambiental" : profile.categoria === "artista" ? "cultura" : profile.categoria === "estudante" ? "educacao" : profile.categoria === "outros" ? "outros" : profile.categoria,
      capturedAt: profile.data_ultima_atualizacao,
      tags: ["tijolo55", "instagram"],
    }, "instagram"));
  }
}

function allowedEndpoints() {
  return new Set((process.env.RADAR_ALLOWED_ENRICHMENT_ENDPOINTS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
}

export class ConfiguredHttpProvider implements RadarSourceProvider {
  sourceType = "configured_http";
  displayName = "Endpoint HTTP configurado";
  constructor(private readonly endpoint: string) {}
  enabled() { return allowedEndpoints().has(this.endpoint); }
  async validateInput(input: unknown) { return { valid: Boolean(input && typeof input === "object"), errors: input && typeof input === "object" ? [] : ["Registro normalizado obrigatório."] }; }
  async normalize(input: unknown) { return records(input).map((item) => normalizeUniversalRecord(item, "manual")); }
  async enrich(record: NormalizedSourceRecord): Promise<EnrichmentResult> {
    if (!this.enabled()) throw new Error("Endpoint não está na allowlist RADAR_ALLOWED_ENRICHMENT_ENDPOINTS.");
    const url = new URL(this.endpoint);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Endpoint configurado deve usar HTTPS.");
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.RADAR_ENRICHMENT_API_KEY ? { authorization: `Bearer ${process.env.RADAR_ENRICHMENT_API_KEY}` } : {}) },
      body: JSON.stringify({ record }),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Endpoint configurado respondeu HTTP ${response.status}.`);
    const result: unknown = await response.json();
    const [normalized] = await this.normalize(result);
    if (!normalized) throw new Error("Endpoint não retornou registro normalizável.");
    return { record: normalized, provider: this.displayName, enrichedAt: new Date().toISOString() };
  }
  async healthCheck(): Promise<ProviderHealth> {
    if (!this.enabled()) return { status: "not_configured", message: "Endpoint fora da allowlist.", checkedAt: new Date().toISOString() };
    return { status: "healthy", message: "Configuração presente; nenhum crawler habilitado.", checkedAt: new Date().toISOString() };
  }
}

export function getProvider(format: "csv" | "json" | "manual") {
  if (format === "csv") return new CsvProvider();
  if (format === "json") return new JsonProvider();
  return new ManualProvider();
}

