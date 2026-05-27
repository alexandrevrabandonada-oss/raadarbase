import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdventureWorldId = "journey" | "territory" | "field" | "memory" | "command";

export type AdventureProgress = Record<AdventureWorldId, number>;

const actionGroups = {
  journey: ["contact.dm_sent", "contact.response_recorded", "contact.referral_recorded"],
  territory: ["territorial.snapshot_generated", "territorial.outreach_shared"],
  field: ["field_agenda.result_created", "field_agenda.event_done"],
  memory: ["strategic_memory.created", "strategic_memory.linked"],
  command: ["action_execution.result_created", "action_execution.item_completed_with_result"],
} as const satisfies Record<AdventureWorldId, string[]>;

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
    const todayIso = getTodayIso();
    const [journey, territory, field, memory, command] = await Promise.all(
      (Object.keys(actionGroups) as AdventureWorldId[]).map(async (world) => {
        const { count, error } = await supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .in("action", actionGroups[world])
          .gte("created_at", todayIso);

        if (error) throw error;
        return count ?? 0;
      }),
    );

    return {
      journey,
      territory,
      field,
      memory,
      command,
    };
  } catch {
    return blankProgress();
  }
}
