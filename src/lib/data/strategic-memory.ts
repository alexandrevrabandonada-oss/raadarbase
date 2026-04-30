/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TableRow, TableInsert, TableUpdate } from "@/lib/supabase/database.types";
import { mockStrategicMemories, mockTopics } from "./e2e-mocks";

export type StrategicMemoryRow = TableRow<"strategic_memories">;
export type StrategicMemoryLinkRow = TableRow<"strategic_memory_links">;

export interface StrategicMemoryWithDetails extends StrategicMemoryRow {
  topic?: TableRow<"topic_categories"> | null;
  links?: StrategicMemoryLinkRow[];
}

export async function listStrategicMemories(filters?: {
  topic_id?: string;
  territory?: string;
  status?: StrategicMemoryRow["status"];
  search?: string;
}) {
  if (shouldUseMockData()) {
    return mockStrategicMemories
      .filter((memory) => (filters?.topic_id ? memory.topic_id === filters.topic_id : true))
      .filter((memory) => (filters?.territory ? memory.territory?.includes(filters.territory) : true))
      .filter((memory) => (filters?.status ? memory.status === filters.status : true))
      .filter((memory) => {
        if (!filters?.search) return true;
        const search = filters.search.toLowerCase();
        return memory.title.toLowerCase().includes(search) || memory.summary.toLowerCase().includes(search);
      })
      .map((memory) => ({
        ...memory,
        topic: mockTopics.find((topic) => topic.id === memory.topic_id) ?? null,
      }));
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("strategic_memories")
    .select(`
      *,
      topic:topic_categories(*)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.topic_id) query = query.eq("topic_id", filters.topic_id);
  if (filters?.territory) query = query.ilike("territory", `%${filters.territory}%`);
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar memórias: ${error.message}`);
  return data || [];
}

export async function getStrategicMemory(id: string): Promise<StrategicMemoryWithDetails | null> {
  if (shouldUseMockData()) {
    const memory = mockStrategicMemories.find((item) => item.id === id);
    if (!memory) return null;

    return {
      ...memory,
      topic: mockTopics.find((topic) => topic.id === memory.topic_id) ?? null,
      links: [],
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("strategic_memories")
    .select(`
      *,
      topic:topic_categories(*),
      links:strategic_memory_links(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar memória: ${error.message}`);
  return data as StrategicMemoryWithDetails | null;
}

export async function createStrategicMemory(input: TableInsert<"strategic_memories">) {
  if (shouldUseMockData()) {
    return {
      id: `memory-mock-${Date.now()}`,
      title: input.title,
      summary: input.summary,
      topic_id: input.topic_id ?? null,
      period_start: input.period_start ?? null,
      period_end: input.period_end ?? null,
      territory: input.territory ?? null,
      status: input.status ?? "active",
      created_by: input.created_by ?? null,
      created_by_email: input.created_by_email ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
      metadata: input.metadata ?? {},
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("strategic_memories")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Falha ao criar memória: ${error.message}`);
  return data;
}

export async function updateStrategicMemory(id: string, input: TableUpdate<"strategic_memories">) {
  if (shouldUseMockData()) {
    const current = mockStrategicMemories.find((item) => item.id === id);
    return {
      ...(current ?? mockStrategicMemories[0]),
      ...input,
      id,
      updated_at: new Date().toISOString(),
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("strategic_memories")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Falha ao atualizar memória: ${error.message}`);
  return data;
}

export async function archiveStrategicMemory(id: string) {
  if (shouldUseMockData()) {
    const current = mockStrategicMemories.find((item) => item.id === id);
    return {
      ...(current ?? mockStrategicMemories[0]),
      id,
      status: "archived" as const,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("strategic_memories")
    .update({ 
      status: "archived", 
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Falha ao arquivar memória: ${error.message}`);
  return data;
}

export async function linkMemoryToEntity(memoryId: string, entityType: string, entityId: string) {
  if (shouldUseMockData()) {
    return {
      id: `link-${memoryId}-${entityType}-${entityId}`,
      memory_id: memoryId,
      entity_type: entityType as any,
      entity_id: entityId,
      created_at: new Date().toISOString(),
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("strategic_memory_links")
    .insert({
      memory_id: memoryId,
      entity_type: entityType as any,
      entity_id: entityId
    })
    .select()
    .single();

  if (error) throw new Error(`Falha ao vincular memória: ${error.message}`);
  return data;
}

export async function unlinkMemoryEntity(memoryId: string, entityType: string, entityId: string) {
  if (shouldUseMockData()) return;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("strategic_memory_links")
    .delete()
    .match({
      memory_id: memoryId,
      entity_type: entityType,
      entity_id: entityId
    });

  if (error) throw new Error(`Falha ao desvincular memória: ${error.message}`);
}

export async function getStrategicMemoryStats() {
  if (shouldUseMockData()) {
    return {
      activeCount: mockStrategicMemories.filter((memory) => memory.status === "active").length,
      draftCount: mockStrategicMemories.filter((memory) => memory.status === "draft").length,
      totalCount: mockStrategicMemories.length,
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: memories, error } = await supabase
    .from("strategic_memories")
    .select("status, topic_id");

  if (error) throw new Error(`Falha ao buscar estatísticas de memória: ${error.message}`);

  const activeCount = memories?.filter(m => m.status === 'active').length || 0;
  const draftCount = memories?.filter(m => m.status === 'draft').length || 0;
  
  return {
    activeCount,
    draftCount,
    totalCount: memories?.length || 0
  };
}

/**
 * Sugere memórias a partir de resultados de execução.
 * Implementação sem IA, focada em síntese de padrões.
 */
export async function suggestMemoriesFromResults(filters?: { topic_id?: string }) {
  if (shouldUseMockData()) {
    const topic = mockTopics.find((item) => item.id === (filters?.topic_id ?? "topic-saude")) ?? mockTopics[0];
    return [
      {
        topic_id: topic.id,
        topic_name: topic.name,
        suggested_title: `Aprendizados sobre ${topic.name}`,
        suggested_summary: "Padrão identificado: escutas e devolutivas publicas consolidaram demandas sem citar pessoas individualmente.",
        source_count: 2,
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  
  // Busca resultados com itens e planos vinculados
  const query = supabase
    .from("action_item_results")
    .select(`
      *,
      item:action_plan_items(
        id,
        title,
        type,
        plan:action_plans(
          id,
          title,
          topic_id,
          topic:topic_categories(id, name)
        )
      )
    `)
    .not("lessons_learned", "is", null);

  if (filters?.topic_id) {
    // Infelizmente o Supabase não suporta filter em nested relations de forma direta assim no select
    // Mas podemos filtrar depois ou usar inner join se necessário.
    // Como o volume de resultados é gerenciável, filtramos no código.
  }

  const { data: rawResults, error } = await query;
  if (error) throw new Error(`Falha ao buscar resultados para sugestão: ${error.message}`);

  let results = rawResults || [];
  if (filters?.topic_id) {
    results = results.filter(r => (r.item as any)?.plan?.topic_id === filters.topic_id);
  }

  const suggestions: any[] = [];
  const groups: Record<string, any[]> = {};

  // Agrupa por tema
  results.forEach(r => {
    const topicId = (r.item as any)?.plan?.topic_id;
    const topicName = (r.item as any)?.plan?.topic?.name || "Geral";
    if (!groups[topicId]) groups[topicId] = [];
    groups[topicId].push(r);
  });

  // Sintetiza padrões por grupo
  for (const topicId in groups) {
    const topicResults = groups[topicId];
    const topicName = (topicResults[0].item as any)?.plan?.topic?.name || "Geral";
    
    // Padrão de tipo de ação
    const typeCounts: Record<string, number> = {};
    topicResults.forEach(r => {
      const type = (r.item as any).type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    
    const summary = topicResults
      .slice(0, 3)
      .map(r => `- ${r.lessons_learned}`)
      .join("\n");

    suggestions.push({
      topic_id: topicId,
      topic_name: topicName,
      suggested_title: `Aprendizados sobre ${topicName}`,
      suggested_summary: `Padrão identificado: Ações do tipo "${topType?.[0].replace('_', ' ')}" foram as mais recorrentes.\n\nPrincipais lições:\n${summary}`,
      source_count: topicResults.length
    });
  }

  return suggestions;
}
