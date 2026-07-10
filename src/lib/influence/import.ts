import type { Json } from "@/lib/supabase/database.types";
import { classifyProfile, createHttpAiClassifier, type AiClassifier } from "@/lib/influence/classification";
import { getInfluenceClient } from "@/lib/influence/db-types";
import { inferLocation } from "@/lib/influence/location";
import { calculateInfluenceScore, DEFAULT_INFLUENCE_SCORE_CONFIG, parseInfluenceScoreConfig } from "@/lib/influence/score";
import { normalizeUsername, safeBoolean, safeCount, safeUrl, sanitizeText } from "@/lib/influence/sanitize";
import type { InfluenceProfile, NormalizedProfile } from "@/lib/influence/types";

const MAX_IMPORT_ROWS = 25_000;
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

type RawRow = Record<string, unknown>;
type Actor = { id: string; email: string | null };

export type ImportResult = {
  importId: string | null;
  totalRows: number;
  inserted: number;
  updated: number;
  duplicates: number;
  rejected: number;
  errors: string[];
};

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char === '"' && quoted && content[index + 1] === '"') { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { row.push(cell); cell = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && content[index + 1] === "\n") index += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (quoted) throw new Error("CSV inválido: aspas não foram fechadas.");
  if (rows.length === 0) return [];
  const headers = rows[0].map((value) => value.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function parseJson(content: string) {
  const value: unknown = JSON.parse(content);
  const rows = Array.isArray(value) ? value : value && typeof value === "object" && "profiles" in value ? (value as { profiles: unknown }).profiles : null;
  if (!Array.isArray(rows)) throw new Error("JSON deve ser um array de perfis ou conter a chave profiles.");
  return rows.filter((row): row is RawRow => Boolean(row && typeof row === "object" && !Array.isArray(row)));
}

function pick(row: RawRow, ...keys: string[]) {
  for (const key of keys) if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  return null;
}

function extractHashtags(value: string | null) {
  return value?.match(/#[\p{L}\p{N}_-]+/gu) ?? [];
}

function getAiClassifier(): AiClassifier | undefined {
  const endpoint = process.env.INFLUENCE_AI_CLASSIFIER_URL;
  return endpoint ? createHttpAiClassifier(endpoint, process.env.INFLUENCE_AI_CLASSIFIER_KEY) : undefined;
}

async function normalizeRow(row: RawRow, scoreConfig = DEFAULT_INFLUENCE_SCORE_CONFIG): Promise<NormalizedProfile | null> {
  const username = normalizeUsername(pick(row, "username", "userName", "usuario", "handle"));
  if (!username) return null;
  const nome = sanitizeText(pick(row, "nome", "name", "fullName", "display_name"), 160);
  const bio = sanitizeText(pick(row, "bio", "biography", "description"), 1000);
  const site = safeUrl(pick(row, "site", "website", "external_url", "url"));
  const empresa = safeBoolean(pick(row, "empresa", "is_business", "isBusinessAccount"));
  const criador = safeBoolean(pick(row, "criador", "is_creator", "isCreator"));
  const classification = await classifyProfile({ username, nome, bio, site, empresa, criador }, getAiClassifier());
  const location = inferLocation({ bio, site, text: sanitizeText(pick(row, "texto", "profile_text", "caption"), 2000), hashtags: extractHashtags(bio) });
  const seguidores = safeCount(pick(row, "seguidores", "followers", "followersCount", "follower_count"));
  const contaVerificada = safeBoolean(pick(row, "conta_verificada", "verified", "isVerified"));
  const score = calculateInfluenceScore({ seguidores, contaVerificada, empresa, criador, locationConfidence: location.confidence }, scoreConfig);
  return {
    username, nome, foto: safeUrl(pick(row, "foto", "photo", "profile_pic_url", "profilePicUrl")), bio,
    categoria: classification.categoria, site, cidade: location.cidade, estado: location.estado,
    seguidores, seguindo: safeCount(pick(row, "seguindo", "following", "followingCount")), posts: safeCount(pick(row, "posts", "postsCount", "media_count")),
    conta_verificada: contaVerificada, criador, empresa, privada: safeBoolean(pick(row, "privada", "private", "isPrivate")),
    influence_score: score.score, score_components: score.components,
    classification_confidence: classification.confidence, classification_source: classification.source,
    location_confidence: location.confidence, location_evidence: location.evidence,
    source: "importacao_legitima", source_reference: sanitizeText(pick(row, "source_reference", "profileUrl"), 500),
    raw_profile: row as Json, data_ultima_atualizacao: new Date().toISOString(),
  };
}

function chunks<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

export function parseImportContent(content: string, format: "csv" | "json") {
  if (new TextEncoder().encode(content).byteLength > MAX_IMPORT_BYTES) throw new Error("Arquivo excede o limite de 10 MB.");
  const rows = format === "csv" ? parseCsv(content) : parseJson(content);
  if (rows.length > MAX_IMPORT_ROWS) throw new Error(`Importação limitada a ${MAX_IMPORT_ROWS.toLocaleString("pt-BR")} perfis por requisição.`);
  return rows;
}

export async function normalizeImportedProfiles(rows: RawRow[]) {
  const supabase = getInfluenceClient();
  const configResult = await supabase.from("influence_score_config").select("config").eq("id", "default").maybeSingle();
  const scoreConfig = configResult.error ? DEFAULT_INFLUENCE_SCORE_CONFIG : parseInfluenceScoreConfig(configResult.data?.config);
  const unique = new Map<string, NormalizedProfile>();
  let rejected = 0;
  let duplicates = 0;
  for (const row of rows) {
    const normalized = await normalizeRow(row, scoreConfig);
    if (!normalized) { rejected += 1; continue; }
    if (unique.has(normalized.username)) duplicates += 1;
    unique.set(normalized.username, normalized);
  }
  return { profiles: [...unique.values()], rejected, duplicates };
}

export async function importInfluenceProfiles(content: string, format: "csv" | "json", actor: Actor, filename?: string | null): Promise<ImportResult> {
  const rows = parseImportContent(content, format);
  const supabase = getInfluenceClient();
  const importRecord = await supabase.from("instagram_imports").insert({ filename: sanitizeText(filename, 240), format, total_rows: rows.length, created_by: actor.id }).select("id").single();
  if (importRecord.error) throw importRecord.error;
  const importId = importRecord.data.id;
  const result: ImportResult = { importId, totalRows: rows.length, inserted: 0, updated: 0, duplicates: 0, rejected: 0, errors: [] };
  try {
    const normalized = await normalizeImportedProfiles(rows);
    result.rejected = normalized.rejected;
    result.duplicates = normalized.duplicates;
    const existingByUsername = new Map<string, InfluenceProfile>();
    for (const usernames of chunks(normalized.profiles.map((profile) => profile.username), 500)) {
      const existing = await supabase.from("instagram_profiles").select("*").in("username", usernames);
      if (existing.error) throw existing.error;
      for (const profile of existing.data ?? []) existingByUsername.set(profile.username, profile);
    }

    for (const batch of chunks(normalized.profiles, 500)) {
      const upsert = await supabase.from("instagram_profiles").upsert(batch, { onConflict: "username" }).select("id,username,categoria,classification_confidence,classification_source");
      if (upsert.error) throw upsert.error;
      result.inserted += batch.filter((profile) => !existingByUsername.has(profile.username)).length;
      result.updated += batch.filter((profile) => existingByUsername.has(profile.username)).length;
      const idsByUsername = new Map((upsert.data ?? []).map((profile) => [profile.username, profile]));
      const history = batch.flatMap((profile) => {
        const previous = existingByUsername.get(profile.username);
        const current = idsByUsername.get(profile.username);
        return previous && current ? [{ profile_id: current.id, snapshot: previous as unknown as Json, changed_fields: Object.keys(profile), reason: "importacao", created_by: actor.id }] : [];
      });
      const classifications = batch.flatMap((profile) => {
        const current = idsByUsername.get(profile.username);
        return current ? [{ profile_id: current.id, categoria: profile.categoria ?? "outros", confidence: profile.classification_confidence ?? 0, source: profile.classification_source ?? "regra", rationale: "Classificação calculada durante importação autorizada.", created_by: actor.id }] : [];
      });
      if (history.length) { const saved = await supabase.from("instagram_profile_history").insert(history); if (saved.error) throw saved.error; }
      if (classifications.length) { const saved = await supabase.from("instagram_profile_classifications").insert(classifications); if (saved.error) throw saved.error; }
    }
    const complete = await supabase.from("instagram_imports").update({ status: "completed", inserted_rows: result.inserted, updated_rows: result.updated, duplicate_rows: result.duplicates, rejected_rows: result.rejected, completed_at: new Date().toISOString() }).eq("id", importId);
    if (complete.error) throw complete.error;
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na importação.";
    result.errors.push(message);
    await supabase.from("instagram_imports").update({ status: "failed", error_summary: message, completed_at: new Date().toISOString() }).eq("id", importId);
    throw error;
  }
}
