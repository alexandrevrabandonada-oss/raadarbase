import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { outreachTasks as mockTasks } from "@/lib/mock-data";
import type { OutreachTaskWithPerson } from "@/lib/types";
import { handleSupabaseReadError } from "./utils";

export async function listOutreachTasks(): Promise<OutreachTaskWithPerson[]> {
  if (shouldUseMockData()) return mockTasks;
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("outreach_tasks").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const personIds = [...new Set((data ?? []).map((item) => item.person_id))];
    const { data: peopleData } = personIds.length
      ? await supabase.from("ig_people").select("id, username, status").in("id", personIds)
      : { data: [] };
    const peopleById = new Map((peopleData ?? []).map((person) => [person.id, person]));
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
      person: peopleById.get(task.person_id)
        ? {
            id: peopleById.get(task.person_id)!.id,
            username: peopleById.get(task.person_id)!.username,
            status: peopleById.get(task.person_id)!.status,
          }
        : null,
    }));
  } catch (error) {
    handleSupabaseReadError("listOutreachTasks", error);
  }
}

export async function listOutreachTasksForPerson(personId: string): Promise<OutreachTaskWithPerson[]> {
  const tasks = await listOutreachTasks();
  return tasks.filter((task) => task.personId === personId);
}
