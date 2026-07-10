import { shouldUseMockData } from "@/lib/config";
import { getInfluenceClient } from "@/lib/influence/db-types";
import { MOCK_INFLUENCE_PROFILES } from "@/lib/influence/mock-data";
import { INFLUENCE_CATEGORIES, type InfluenceFilters, type InfluenceListResult, type InfluenceProfile } from "@/lib/influence/types";
import { sanitizeText } from "@/lib/influence/sanitize";

const SORT_COLUMNS = { score: "influence_score", seguidores: "seguidores", nome: "nome", atualizacao: "data_ultima_atualizacao" } as const;
export const SUL_FLUMINENSE_CITIES = ["Volta Redonda", "Barra Mansa", "Resende", "Piraí", "Pinheiral", "Itatiaia", "Quatis", "Porto Real", "Valença", "Rio Claro"];

function normalizeFilters(filters: InfluenceFilters): Required<Pick<InfluenceFilters, "page" | "pageSize" | "sort" | "direction">> & InfluenceFilters {
  return {
    ...filters,
    page: Math.max(1, Math.floor(filters.page ?? 1)),
    pageSize: Math.min(100, Math.max(10, Math.floor(filters.pageSize ?? 50))),
    sort: filters.sort && SORT_COLUMNS[filters.sort] ? filters.sort : "score",
    direction: filters.direction === "asc" ? "asc" : "desc",
  };
}

function filterMocks(filters: InfluenceFilters) {
  const query = filters.query?.toLocaleLowerCase("pt-BR");
  return MOCK_INFLUENCE_PROFILES.filter((profile) => {
    if (query && !`${profile.nome ?? ""} ${profile.username} ${profile.categoria} ${profile.cidade ?? ""} ${profile.estado ?? ""}`.toLocaleLowerCase("pt-BR").includes(query)) return false;
    if (filters.categoria && profile.categoria !== filters.categoria) return false;
    if (filters.cidade && profile.cidade !== filters.cidade) return false;
    if (filters.estado && profile.estado !== filters.estado) return false;
    if (filters.regiao === "sul-fluminense" && (!profile.cidade || !SUL_FLUMINENSE_CITIES.includes(profile.cidade))) return false;
    if (filters.minScore !== undefined && profile.influence_score < filters.minScore) return false;
    if (filters.maxScore !== undefined && profile.influence_score > filters.maxScore) return false;
    if (filters.minSeguidores !== undefined && profile.seguidores < filters.minSeguidores) return false;
    if (filters.maxSeguidores !== undefined && profile.seguidores > filters.maxSeguidores) return false;
    return true;
  });
}

export async function listInfluenceProfiles(filters: InfluenceFilters = {}): Promise<InfluenceListResult> {
  const normalized = normalizeFilters(filters);
  if (shouldUseMockData()) {
    const all = filterMocks(normalized).toSorted((a, b) => {
      const column = SORT_COLUMNS[normalized.sort];
      const left = a[column] ?? "";
      const right = b[column] ?? "";
      const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR");
      return normalized.direction === "asc" ? order : -order;
    });
    const start = (normalized.page - 1) * normalized.pageSize;
    const totalFollowers = MOCK_INFLUENCE_PROFILES.reduce((sum, profile) => sum + profile.seguidores, 0);
    return {
      items: all.slice(start, start + normalized.pageSize), total: all.length, page: normalized.page,
      pageSize: normalized.pageSize, totalPages: Math.max(1, Math.ceil(all.length / normalized.pageSize)),
      kpis: { totalProfiles: MOCK_INFLUENCE_PROFILES.length, totalFollowers, averageFollowers: Math.round(totalFollowers / MOCK_INFLUENCE_PROFILES.length) },
      cities: [...new Set(MOCK_INFLUENCE_PROFILES.map((profile) => profile.cidade).filter((city): city is string => Boolean(city)))].sort(),
    };
  }

  const supabase = getInfluenceClient();
  const start = (normalized.page - 1) * normalized.pageSize;
  let query = supabase.from("instagram_profiles").select("*", { count: "exact" });
  const search = sanitizeText(normalized.query, 80)?.replace(/[,()%]/g, " ");
  if (search) query = query.or(`username.ilike.%${search}%,nome.ilike.%${search}%,bio.ilike.%${search}%`);
  if (normalized.categoria && INFLUENCE_CATEGORIES.includes(normalized.categoria)) query = query.eq("categoria", normalized.categoria);
  if (normalized.cidade) query = query.eq("cidade", sanitizeText(normalized.cidade, 80) ?? "");
  if (normalized.estado) query = query.eq("estado", normalized.estado.toUpperCase().slice(0, 2));
  if (normalized.regiao === "sul-fluminense") query = query.in("cidade", SUL_FLUMINENSE_CITIES);
  if (normalized.minScore !== undefined) query = query.gte("influence_score", normalized.minScore);
  if (normalized.maxScore !== undefined) query = query.lte("influence_score", normalized.maxScore);
  if (normalized.minSeguidores !== undefined) query = query.gte("seguidores", normalized.minSeguidores);
  if (normalized.maxSeguidores !== undefined) query = query.lte("seguidores", normalized.maxSeguidores);

  const [profilesResult, kpisResult, cityResult] = await Promise.all([
    query.order(SORT_COLUMNS[normalized.sort], { ascending: normalized.direction === "asc", nullsFirst: false }).range(start, start + normalized.pageSize - 1),
    supabase.rpc("get_instagram_influence_kpis"),
    supabase.from("instagram_profiles").select("cidade").not("cidade", "is", null).limit(1000),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (kpisResult.error) throw kpisResult.error;
  if (cityResult.error) throw cityResult.error;
  const kpis = kpisResult.data?.[0];
  const total = profilesResult.count ?? 0;
  return {
    items: (profilesResult.data ?? []) as InfluenceProfile[], total, page: normalized.page, pageSize: normalized.pageSize,
    totalPages: Math.max(1, Math.ceil(total / normalized.pageSize)),
    kpis: { totalProfiles: Number(kpis?.total_profiles ?? 0), totalFollowers: Number(kpis?.total_followers ?? 0), averageFollowers: Number(kpis?.average_followers ?? 0) },
    cities: [...new Set((cityResult.data ?? []).map((row) => row.cidade).filter((city): city is string => Boolean(city)))].sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}

export async function getInfluenceProfile(id: string) {
  if (shouldUseMockData()) {
    const profile = MOCK_INFLUENCE_PROFILES.find((item) => item.id === id) ?? null;
    return profile ? { profile, history: [], classifications: [], notes: [] } : null;
  }
  const supabase = getInfluenceClient();
  const [profile, history, classifications, notes] = await Promise.all([
    supabase.from("instagram_profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("instagram_profile_history").select("*").eq("profile_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("instagram_profile_classifications").select("*").eq("profile_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("instagram_profile_notes").select("*").eq("profile_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  for (const result of [profile, history, classifications, notes]) if (result.error) throw result.error;
  if (!profile.data) return null;
  return { profile: profile.data as InfluenceProfile, history: history.data ?? [], classifications: classifications.data ?? [], notes: notes.data ?? [] };
}
