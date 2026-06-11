/**
 * Motor de Locks Temporários (Prevenção de Abordagem Concorrente)
 * 
 * Evita que múltiplos operadores tentem interagir com o mesmo contato ao mesmo tempo.
 * Suporta persistência em banco de dados ou fallback em memória para modo mock/demonstração.
 */

import { USE_MOCKS } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type LockInfo = {
  operatorId: string;
  operatorName: string;
  expiresAt: number;
};

type OutreachLockRow = {
  person_id: string;
  operator_id: string;
  operator_name: string;
  expires_at: string;
};

type OutreachLockQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: <T>() => Promise<{ data: T | null; error: unknown }>;
    };
  };
  update: (payload: Partial<OutreachLockRow>) => {
    eq: (column: string, value: string) => Promise<{ error: unknown }>;
  };
  upsert: (payload: OutreachLockRow) => Promise<{ error: unknown }>;
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (nestedColumn: string, nestedValue: string) => Promise<{ error: unknown }>;
    };
  };
};

function outreachLocksTable(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>): OutreachLockQuery {
  return supabase.from("outreach_locks" as never) as unknown as OutreachLockQuery;
}

// Map de ID do contato -> Informações do Lock (Fallback em memória)
const memoryLocks = new Map<string, LockInfo>();

/**
 * Adquire o bloqueio temporário (lock) sobre um contato
 */
export async function acquireOutreachLock(
  personId: string,
  operatorId: string,
  operatorName: string
): Promise<{ success: boolean; ownerName?: string; unavailable?: boolean }> {
  if (USE_MOCKS) {
    const now = Date.now();
    const currentLock = memoryLocks.get(personId);

    // Se já há um lock ativo e não expirou
    if (currentLock && currentLock.expiresAt > now) {
      // Se o dono do lock for o próprio operador, estende o tempo por mais 5 minutos
      if (currentLock.operatorId === operatorId) {
        currentLock.expiresAt = now + 5 * 60 * 1000;
        return { success: true };
      }
      // Caso contrário, bloqueado por outro
      return { success: false, ownerName: currentLock.operatorName };
    }

    // Define um novo lock por 5 minutos
    memoryLocks.set(personId, {
      operatorId,
      operatorName,
      expiresAt: now + 5 * 60 * 1000,
    });

    return { success: true };
  }

  // Persistência distribuída no Banco de Dados
  try {
    const supabase = await getSupabaseServerClient();
    
    // Consulta lock existente
    const { data: lock, error } = await outreachLocksTable(supabase)
      .select("*")
      .eq("person_id", personId)
      .maybeSingle<OutreachLockRow>();

    if (error) throw error;

    if (lock) {
      const expiresAtMs = new Date(lock.expires_at).getTime();
      if (expiresAtMs > Date.now()) {
        // Lock ativo
        if (lock.operator_id === operatorId) {
          // Renovação / Extensão de 5 minutos
          const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          const { error: updateError } = await outreachLocksTable(supabase)
            .update({ expires_at: newExpiresAt })
            .eq("person_id", personId);
          
          if (updateError) throw updateError;
          return { success: true };
        }
        return { success: false, ownerName: lock.operator_name };
      }
    }

    // Cria ou substitui o lock expirado
    const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: upsertError } = await outreachLocksTable(supabase)
      .upsert({
        person_id: personId,
        operator_id: operatorId,
        operator_name: operatorName,
        expires_at: newExpiresAt,
      });

    if (upsertError) throw upsertError;
    return { success: true };
  } catch (err) {
    console.error("Database lock acquisition failed; blocking contact conservatively:", err);
    return { success: false, unavailable: true, ownerName: "verificacao_indisponivel" };
  }
}

/**
 * Libera explicitamente o bloqueio sobre um contato
 */
export async function releaseOutreachLock(personId: string, operatorId: string): Promise<void> {
  if (USE_MOCKS) {
    const currentLock = memoryLocks.get(personId);
    if (currentLock && currentLock.operatorId === operatorId) {
      memoryLocks.delete(personId);
    }
    return;
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await outreachLocksTable(supabase)
      .delete()
      .eq("person_id", personId)
      .eq("operator_id", operatorId);
    if (error) throw error;
  } catch (err) {
    console.error("Database lock release failed, falling back to memory:", err);
    const currentLock = memoryLocks.get(personId);
    if (currentLock && currentLock.operatorId === operatorId) {
      memoryLocks.delete(personId);
    }
  }
}

/**
 * Consulta o status atual de bloqueio do contato
 */
export async function checkOutreachLock(
  personId: string,
  operatorId: string
): Promise<{ locked: boolean; lockedByOther: boolean; ownerName?: string; expiresAt?: number; unavailable?: boolean }> {
  if (USE_MOCKS) {
    const now = Date.now();
    const currentLock = memoryLocks.get(personId);

    if (currentLock && currentLock.expiresAt > now) {
      const isSelf = currentLock.operatorId === operatorId;
      return {
        locked: true,
        lockedByOther: !isSelf,
        ownerName: currentLock.operatorName,
        expiresAt: currentLock.expiresAt,
      };
    }

    return { locked: false, lockedByOther: false };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: lock, error } = await outreachLocksTable(supabase)
      .select("*")
      .eq("person_id", personId)
      .maybeSingle<OutreachLockRow>();

    if (error) throw error;

    if (lock) {
      const expiresAtMs = new Date(lock.expires_at).getTime();
      if (expiresAtMs > Date.now()) {
        const isSelf = lock.operator_id === operatorId;
        return {
          locked: true,
          lockedByOther: !isSelf,
          ownerName: lock.operator_name,
          expiresAt: expiresAtMs,
        };
      }
    }

    return { locked: false, lockedByOther: false };
  } catch (err) {
    console.error("Database lock check failed; blocking contact conservatively:", err);
    return {
      locked: true,
      lockedByOther: true,
      ownerName: "verificacao_indisponivel",
      unavailable: true,
    };
  }
}
