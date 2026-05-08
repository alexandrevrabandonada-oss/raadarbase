import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { outreachTasks as mockTasks } from "@/lib/mock-data";
import type { OutreachTaskWithPerson } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

export async function listOutreachTasks(): Promise<OutreachTaskWithPerson[]> {
  if (shouldUseMockData()) return mockTasks;
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("outreach_tasks")
      .select("*, person:ig_people(id, username, status)")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return (data ?? []).map((task) => ({
      id: task.id,
      personId: task.person_id,
      column: task.column_key as OutreachTaskWithPerson["column"],
      title: task.title,
      notes: task.notes,
      dueAt: task.due_at,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      responsibleId: task.responsible_id ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      person: (task as any).person ? {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (task as any).person.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        username: (task as any).person.username,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (task as any).person.status,
      } : null,
    }));
  } catch (error) {
    handleSupabaseReadError("listOutreachTasks", error);
  }
}

export async function listOutreachTasksForPerson(personId: string): Promise<OutreachTaskWithPerson[]> {
  const tasks = await listOutreachTasks();
  return tasks.filter((task) => task.personId === personId);
}
