import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/config";
import { people as mockPeople, outreachTasks as mockTasks } from "@/lib/mock-data";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import type { AuditAction, KanbanColumnId } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";

export type ActionResult = { ok: true; message: string; id?: string } | { ok: false; error: string };

export function validateId(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} inválido.`);
}

export function validateNotes(value: string) {
  if (value.length > 5000) throw new Error("Notas excedem o limite permitido.");
}

export function validateTags(tags: string[]) {
  if (!Array.isArray(tags) || tags.some((tag) => !tag.trim())) {
    throw new Error("Tags temáticas inválidas.");
  }
}

export async function requireActor() {
  const user = await requireInternalSession();
  return { actorId: user.id, actorEmail: user.email ?? null };
}

export async function performAction({
  action,
  entityType,
  entityId,
  summary,
  metadata,
  mutate,
  revalidate,
}: {
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata?: Json;
  mutate: () => Promise<void>;
  revalidate?: string[];
}): Promise<ActionResult> {
  try {
    const actor = await requireActor();
    await mutate();
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase nao configurado para auditoria.");
    }
    await writeAuditLog({
      ...actor,
      action,
      entityType,
      entityId,
      summary,
      metadata,
    });
    revalidate?.forEach((path) => revalidatePath(path));
    return { ok: true, message: summary };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao executar ação.",
    };
  }
}

export function updateMockPerson(personId: string, updater: (person: (typeof mockPeople)[number]) => void) {
  const person = mockPeople.find((item) => item.id === personId);
  if (!person) throw new Error("Pessoa não encontrada.");
  updater(person);
}

export function upsertMockTask(
  personId: string,
  payload: { column: KanbanColumnId; title: string; notes?: string; completedAt?: string | null },
) {
  const existing = mockTasks.find((task) => task.personId === personId && !task.completedAt);
  if (existing) {
    existing.column = payload.column;
    existing.title = payload.title;
    existing.notes = payload.notes ?? existing.notes;
    existing.completedAt = payload.completedAt ?? null;
    return existing.id;
  }

  const id = `task-${crypto.randomUUID()}`;
  mockTasks.unshift({
    id,
    personId,
    column: payload.column,
    title: payload.title,
    notes: payload.notes ?? "",
    dueAt: null,
    completedAt: payload.completedAt ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    responsibleId: null,
    person: null,
  });
  return id;
}
