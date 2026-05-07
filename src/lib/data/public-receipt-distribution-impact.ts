/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";

export type DistributionImpactSummary = {
  cycleId: string;
  before: {
    reportCount: number;
    neighborhoodCount: number;
    pautaCount: number;
  };
  after: {
    reportCount: number;
    neighborhoodCount: number;
    pautaCount: number;
  };
  delta: {
    reportCount: number;
    neighborhoodCount: number;
    pautaCount: number;
  };
  status: "gerou_retorno" | "sem_retorno_ainda" | "precisa_reforco" | "sem_dados_suficientes";
};

export async function getReceiptDistributionImpact(cycleId: string): Promise<DistributionImpactSummary> {
  if (shouldUseMockData()) {
    return {
      cycleId,
      before: { reportCount: 10, neighborhoodCount: 3, pautaCount: 2 },
      after: { reportCount: 25, neighborhoodCount: 5, pautaCount: 4 },
      delta: { reportCount: 15, neighborhoodCount: 2, pautaCount: 2 },
      status: "gerou_retorno",
    };
  }

  const supabase = getSupabaseAdminClient();
  
  // Buscar o ciclo
  const { data: cycle, error: cycleError } = await (supabase
    .from("public_receipt_distribution_cycles" as any) as any)
    .select("*")
    .eq("id", cycleId)
    .single();

  if (cycleError || !cycle) {
    throw new Error(`Ciclo não encontrado: ${cycleId}`);
  }

  if (!cycle.starts_at) {
    return {
      cycleId,
      before: { reportCount: 0, neighborhoodCount: 0, pautaCount: 0 },
      after: { reportCount: 0, neighborhoodCount: 0, pautaCount: 0 },
      delta: { reportCount: 0, neighborhoodCount: 0, pautaCount: 0 },
      status: "sem_dados_suficientes",
    };
  }

  const start = new Date(cycle.starts_at);
  const end = cycle.ends_at ? new Date(cycle.ends_at) : new Date();
  
  // Definir periodo "antes" (mesma duracao ou 7 dias)
  const durationMs = end.getTime() - start.getTime() || 7 * 24 * 60 * 60 * 1000;
  const beforeStart = new Date(start.getTime() - durationMs);

  // Contagem de relatos "antes"
  const { count: beforeCount } = await supabase
    .from("bairro_escuta_submissions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", beforeStart.toISOString())
    .lt("created_at", start.toISOString());

  // Contagem de relatos "depois/durante"
  const { count: afterCount } = await supabase
    .from("bairro_escuta_submissions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  // Agregados por bairro e pauta (apenas contagem de grupos)
  const { data: beforeGroups } = await supabase
    .from("bairro_escuta_submissions")
    .select("bairro, pauta")
    .gte("created_at", beforeStart.toISOString())
    .lt("created_at", start.toISOString());

  const { data: afterGroups } = await supabase
    .from("bairro_escuta_submissions")
    .select("bairro, pauta")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const beforeBairros = new Set(beforeGroups?.map(g => g.bairro) || []);
  const beforePautas = new Set(beforeGroups?.map(g => g.pauta) || []);
  
  const afterBairros = new Set(afterGroups?.map(g => g.bairro) || []);
  const afterPautas = new Set(afterGroups?.map(g => g.pauta) || []);

  const summary: DistributionImpactSummary = {
    cycleId,
    before: {
      reportCount: beforeCount || 0,
      neighborhoodCount: beforeBairros.size,
      pautaCount: beforePautas.size,
    },
    after: {
      reportCount: afterCount || 0,
      neighborhoodCount: afterBairros.size,
      pautaCount: afterPautas.size,
    },
    delta: {
      reportCount: (afterCount || 0) - (beforeCount || 0),
      neighborhoodCount: afterBairros.size - beforeBairros.size,
      pautaCount: afterPautas.size - beforePautas.size,
    },
    status: "sem_dados_suficientes",
  };

  // Critério de impacto calibrado (Tijolo 069):
  // gerou_retorno: houve novos relatos durante o ciclo
  // sem_retorno_ainda: ciclo ainda ativo, sem novos relatos — aguardar
  // precisa_reforco: ciclo fechado sem qualquer retorno em relatos
  // sem_dados_suficientes: não há dados comparáveis (sem inicio ou sem submissões históricas)
  if (summary.delta.reportCount > 0) {
    summary.status = "gerou_retorno";
  } else if (cycle.status === "closed") {
    summary.status = "precisa_reforco";
  } else if (cycle.status === "active") {
    summary.status = "sem_retorno_ainda";
  } else {
    summary.status = "sem_dados_suficientes";
  }

  return summary;
}

export async function compareBeforeAfterDistribution(cycleId: string) {
  const impact = await getReceiptDistributionImpact(cycleId);
  return {
    deltaRelatos: impact.delta.reportCount,
    deltaBairros: impact.delta.neighborhoodCount,
    deltaPautas: impact.delta.pautaCount,
    status: impact.status
  };
}

export async function getTerritorialReportsAfterDistribution(cycleId: string) {
  const impact = await getReceiptDistributionImpact(cycleId);
  return impact.after;
}
