import type { InfluenceProfile } from "@/lib/influence/types";

const now = new Date().toISOString();
const base = {
  foto: null, site: null, seguindo: 500, posts: 320, privada: false,
  score_components: {}, classification_source: "regra" as const,
  location_evidence: [], source: "seed" as const, source_reference: null,
  raw_profile: {}, data_ultima_atualizacao: now, created_at: now, updated_at: now,
};

export const MOCK_INFLUENCE_PROFILES: InfluenceProfile[] = [
  { ...base, id: "10000000-0000-4000-8000-000000000001", username: "jornal_regional_demo", nome: "Jornal Regional Demo", bio: "Notícias de Volta Redonda", categoria: "jornalista", cidade: "Volta Redonda", estado: "RJ", seguidores: 124500, conta_verificada: true, criador: true, empresa: false, influence_score: 65.95, classification_confidence: .95, location_confidence: .98 },
  { ...base, id: "10000000-0000-4000-8000-000000000002", username: "empresa_sul_demo", nome: "Empresa Sul Demo", bio: "Soluções para Barra Mansa", categoria: "empresa", cidade: "Barra Mansa", estado: "RJ", seguidores: 87500, conta_verificada: false, criador: false, empresa: true, influence_score: 56.42, classification_confidence: .88, location_confidence: .95 },
  { ...base, id: "10000000-0000-4000-8000-000000000003", username: "prof_resende_demo", nome: "Professora Demo", bio: "Professora em Resende RJ", categoria: "professor", cidade: "Resende", estado: "RJ", seguidores: 28600, conta_verificada: false, criador: true, empresa: false, influence_score: 52.2, classification_confidence: .94, location_confidence: .98 },
  { ...base, id: "10000000-0000-4000-8000-000000000004", username: "medica_vr_demo", nome: "Médica Demo", bio: "Médica CRM 00000 | Volta Redonda", categoria: "medico", cidade: "Volta Redonda", estado: "RJ", seguidores: 41200, conta_verificada: false, criador: true, empresa: false, influence_score: 53.15, classification_confidence: .97, location_confidence: .98 },
  { ...base, id: "10000000-0000-4000-8000-000000000005", username: "comercio_bm_demo", nome: "Comércio Demo", bio: "Loja demonstrativa em Barra Mansa", categoria: "comercio", cidade: "Barra Mansa", estado: "RJ", seguidores: 15300, conta_verificada: false, criador: false, empresa: true, influence_score: 48.85, classification_confidence: .9, location_confidence: .9 },
  { ...base, id: "10000000-0000-4000-8000-000000000006", username: "sindicato_demo", nome: "Sindicato Demo", bio: "Sindicato regional fictício", categoria: "sindicato", cidade: null, estado: null, seguidores: 22600, conta_verificada: false, criador: false, empresa: true, influence_score: 47.54, classification_confidence: .98, location_confidence: 0 },
  { ...base, id: "10000000-0000-4000-8000-000000000007", username: "artista_regional_demo", nome: "Artista Demo", bio: "Música e cultura no Sul Fluminense", categoria: "artista", cidade: null, estado: "RJ", seguidores: 64000, conta_verificada: true, criador: true, empresa: false, influence_score: 65.06, classification_confidence: .9, location_confidence: .65 },
  { ...base, id: "10000000-0000-4000-8000-000000000008", username: "ong_ambiental_demo", nome: "ONG Ambiental Demo", bio: "Meio ambiente em Piraí RJ", categoria: "ong", cidade: "Piraí", estado: "RJ", seguidores: 9800, conta_verificada: false, criador: true, empresa: false, influence_score: 47.91, classification_confidence: .93, location_confidence: .98 },
];

