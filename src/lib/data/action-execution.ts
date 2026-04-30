/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { TableInsert, TableUpdate } from "@/lib/supabase/database.types";

export async function listEvidenceForItem(itemId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_item_evidence")
    .select("*")
    .eq("action_plan_item_id", itemId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createActionEvidence(input: TableInsert<"action_item_evidence">) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_item_evidence")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateActionEvidence(id: string, input: TableUpdate<"action_item_evidence">) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_item_evidence")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function archiveOrDeleteActionEvidence(id: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("action_item_evidence")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getResultForItem(itemId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_item_results")
    .select("*")
    .eq("action_plan_item_id", itemId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertActionItemResult(input: TableInsert<"action_item_results">) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_item_results")
    .upsert(input, { onConflict: "action_plan_item_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getExecutionSummaryForPlan(planId: string) {
  if (shouldUseMockData()) {
    return {
      totalItems: 2,
      completedItems: 1,
      itemsWithEvidence: 1,
      itemsWithResult: 1,
      nextSteps: ["Publicar devolutiva da escuta"],
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: items, error } = await supabase
    .from("action_plan_items")
    .select(`
      id,
      status,
      action_item_evidence (id),
      action_item_results (id, next_step)
    `)
    .eq("action_plan_id", planId);

  if (error) throw error;

  const totalItems = items.length;
  const completedItems = items.filter(i => i.status === 'done').length;
  const itemsWithEvidence = items.filter(i => (i.action_item_evidence as any[]).length > 0).length;
  const itemsWithResult = items.filter(i => i.action_item_results).length;
  
  const nextSteps = items
    .map(i => (i.action_item_results as any)?.next_step)
    .filter(Boolean);

  return {
    totalItems,
    completedItems,
    itemsWithEvidence,
    itemsWithResult,
    nextSteps
  };
}

export async function getExecutionStats() {
  if (shouldUseMockData()) {
    return {
      activeActions: 1,
      completedTasks: 1,
      tasksWithEvidence: 1,
      resultsRegistered: 1,
      overdueTasks: 0,
      completedWithoutResult: 0,
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("action_plan_items")
    .select(`
      id,
      status,
      due_date,
      action_item_evidence (id),
      action_item_results (id)
    `);

  if (error) throw error;

  const now = new Date().toISOString().split('T')[0];

  return {
    activeActions: data.filter(i => i.status === 'doing').length,
    completedTasks: data.filter(i => i.status === 'done').length,
    tasksWithEvidence: data.filter(i => (i.action_item_evidence as any[]).length > 0).length,
    resultsRegistered: data.filter(i => i.action_item_results).length,
    overdueTasks: data.filter(i => i.due_date && i.due_date < now && i.status !== 'done').length,
    completedWithoutResult: data.filter(i => i.status === 'done' && !i.action_item_results).length
  };
}
