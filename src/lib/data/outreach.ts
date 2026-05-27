import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { outreachTasks as mockTasks } from "@/lib/mock-data";
import type { OutreachTaskWithPerson, PersonStatus } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

type ListOutreachTasksOptions = {
  responsibleId?: string;
  personId?: string;
};

function mapOutreachTask(task: {
  id: string;
  person_id: string;
  column_key: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  responsible_id: string | null;
  person?: { id: string; username: string; status: string } | null;
}): OutreachTaskWithPerson {
  return {
    id: task.id,
    personId: task.person_id,
    column: task.column_key as OutreachTaskWithPerson["column"],
    title: task.title,
    notes: task.notes ?? "",
    dueAt: task.due_at,
    completedAt: task.completed_at,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    responsibleId: task.responsible_id ?? null,
    person: task.person ? {
      id: task.person.id,
      username: task.person.username,
      status: task.person.status as PersonStatus,
    } : null,
  };
}

export async function listOutreachTasks(options?: ListOutreachTasksOptions): Promise<OutreachTaskWithPerson[]> {
  if (shouldUseMockData()) {
    return mockTasks.filter((task) => {
      if (options?.responsibleId && task.responsibleId !== options.responsibleId) return false;
      if (options?.personId && task.personId !== options.personId) return false;
      return true;
    });
  }

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("outreach_tasks")
      .select("*, person:ig_people(id, username, status)")
      .order("created_at", { ascending: false });

    if (options?.responsibleId) {
      query = query.eq("responsible_id", options.responsibleId);
    }

    if (options?.personId) {
      query = query.eq("person_id", options.personId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data ?? []).map((task) => mapOutreachTask(task));
  } catch (error) {
    handleSupabaseReadError("listOutreachTasks", error);
  }
}

export async function listOutreachTasksForPerson(personId: string): Promise<OutreachTaskWithPerson[]> {
  return listOutreachTasks({ personId });
}
