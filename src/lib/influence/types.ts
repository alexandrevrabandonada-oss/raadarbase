import type { Json } from "@/lib/supabase/database.types";

export const INFLUENCE_CATEGORIES = [
  "politico",
  "jornalista",
  "empresa",
  "comercio",
  "professor",
  "medico",
  "advogado",
  "sindicato",
  "influenciador",
  "ong",
  "ambientalista",
  "servidor_publico",
  "artista",
  "estudante",
  "outros",
] as const;

export type InfluenceCategory = (typeof INFLUENCE_CATEGORIES)[number];
export type ClassificationSource = "regra" | "ia" | "manual";
export type ProfileSource = "importacao_legitima" | "api_oficial" | "entrada_manual" | "seed";

export type InfluenceProfile = {
  id: string;
  username: string;
  nome: string | null;
  foto: string | null;
  bio: string | null;
  categoria: InfluenceCategory;
  site: string | null;
  cidade: string | null;
  estado: string | null;
  seguidores: number;
  seguindo: number;
  posts: number;
  conta_verificada: boolean;
  criador: boolean;
  empresa: boolean;
  privada: boolean;
  influence_score: number;
  score_components: Json;
  classification_confidence: number;
  classification_source: ClassificationSource;
  location_confidence: number;
  location_evidence: Json;
  source: ProfileSource;
  source_reference: string | null;
  raw_profile: Json;
  data_ultima_atualizacao: string;
  created_at: string;
  updated_at: string;
};

export type InfluenceProfileInput = Partial<Omit<InfluenceProfile, "id" | "created_at" | "updated_at">> & {
  username: string;
};

export type InfluenceFilters = {
  query?: string;
  categoria?: InfluenceCategory;
  cidade?: string;
  estado?: string;
  regiao?: "sul-fluminense";
  minScore?: number;
  maxScore?: number;
  minSeguidores?: number;
  maxSeguidores?: number;
  sort?: "score" | "seguidores" | "nome" | "atualizacao";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type InfluenceKpis = {
  totalProfiles: number;
  totalFollowers: number;
  averageFollowers: number;
};

export type InfluenceListResult = {
  items: InfluenceProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  kpis: InfluenceKpis;
  cities: string[];
};

export type NormalizedProfile = Omit<InfluenceProfile, "id" | "created_at" | "updated_at" | "score_components" | "raw_profile"> & {
  score_components: Record<string, number>;
  raw_profile: Json;
};

export const CATEGORY_LABELS: Record<InfluenceCategory, string> = {
  politico: "Política",
  jornalista: "Imprensa",
  empresa: "Empresa",
  comercio: "Comércio",
  professor: "Professor(a)",
  medico: "Médico(a)",
  advogado: "Advogado(a)",
  sindicato: "Sindicato",
  influenciador: "Influenciador(a)",
  ong: "ONG",
  ambientalista: "Ambientalista",
  servidor_publico: "Servidor(a) público(a)",
  artista: "Artista",
  estudante: "Estudante",
  outros: "Outros",
};
