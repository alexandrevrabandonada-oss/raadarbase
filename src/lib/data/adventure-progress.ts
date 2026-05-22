import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdventureWorldId = "journey" | "territory" | "field" | "memory" | "command";

export type AdventureProgress = Record<AdventureWorldId, number>;

const trackedActions = [
  "contact.dm_sent",
  "contact.response_recorded",
  "contact.referral_recorded",
  "territorial.snapshot_generated",
  "territorial.outreach_shared",
  "field_agenda.result_created",
  "field_agenda.event_done",
  "strategic_memory.created",
  "strategic_memory.linked",
  "action_execution.result_created",
  "action_execution.item_completed_with_result",
] as const;

function getTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function blankProgress(): AdventureProgress {
  return {
    journey: 0,
    territory: 0,
    field: 0,
    memory: 0,
    command: 0,
  };
}

export async function getAdventureProgress(): Promise<AdventureProgress> {
  if (shouldUseMockData()) {
    return {
      journey: 4,
      territory: 1,
      field: 1,
      memory: 0,
      command: 1,
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("action")
      .in("action", trackedActions)
      .gte("created_at", getTodayIso());

    if (error) throw error;

    return (data ?? []).reduce<AdventureProgress>((progress, row) => {
      if (row.action === "contact.dm_sent" || row.action === "contact.response_recorded" || row.action === "contact.referral_recorded") {
        progress.journey += 1;
      }
      if (row.action === "territorial.snapshot_generated" || row.action === "territorial.outreach_shared") {
        progress.territory += 1;
      }
      if (row.action === "field_agenda.result_created" || row.action === "field_agenda.event_done") {
        progress.field += 1;
      }
      if (row.action === "strategic_memory.created" || row.action === "strategic_memory.linked") {
        progress.memory += 1;
      }
      if (row.action === "action_execution.result_created" || row.action === "action_execution.item_completed_with_result") {
        progress.command += 1;
      }
      return progress;
    }, blankProgress());
  } catch {
    return blankProgress();
  }
}
