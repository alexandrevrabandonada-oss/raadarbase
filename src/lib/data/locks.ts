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

// Map de ID do contato -> Informações do Lock (Fallback em memória)
const memoryLocks = new Map<string, LockInfo>();

/**
 * Adquire o bloqueio temporário (lock) sobre um contato
 */
export async function acquireOutreachLock(
  personId: string,
  operatorId: string,
  operatorName: string
): Promise<{ success: boolean; ownerName?: string }> {
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
    const supabase = (await getSupabaseServerClient()) as any;
    
    // Consulta lock existente
    const { data: lock, error } = await supabase
      .from("outreach_locks" as any)
      .select("*")
      .eq("person_id", personId)
      .maybeSingle();

    if (error) throw error;

    if (lock) {
      const expiresAtMs = new Date(lock.expires_at).getTime();
      if (expiresAtMs > Date.now()) {
        // Lock ativo
        if (lock.operator_id === operatorId) {
          // Renovação / Extensão de 5 minutos
          const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          const { error: updateError } = await supabase
            .from("outreach_locks" as any)
            .update({ expires_at: newExpiresAt } as any)
            .eq("person_id", personId);
          
          if (updateError) throw updateError;
          return { success: true };
        }
        return { success: false, ownerName: lock.operator_name };
      }
    }

    // Cria ou substitui o lock expirado
    const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: upsertError } = await supabase
      .from("outreach_locks" as any)
      .upsert({
        person_id: personId,
        operator_id: operatorId,
        operator_name: operatorName,
        expires_at: newExpiresAt,
      } as any);

    if (upsertError) throw upsertError;
    return { success: true };
  } catch (err) {
    console.error("Database lock acquisition failed, falling back to memory:", err);
    // Fallback de contingência para evitar travar a operação
    const now = Date.now();
    memoryLocks.set(personId, {
      operatorId,
      operatorName,
      expiresAt: now + 5 * 60 * 1000,
    });
    return { success: true };
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
    const supabase = (await getSupabaseServerClient()) as any;
    const { error } = await supabase
      .from("outreach_locks" as any)
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
): Promise<{ locked: boolean; lockedByOther: boolean; ownerName?: string; expiresAt?: number }> {
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
    const supabase = (await getSupabaseServerClient()) as any;
    const { data: lock, error } = await supabase
      .from("outreach_locks" as any)
      .select("*")
      .eq("person_id", personId)
      .maybeSingle();

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
    console.error("Database lock check failed, falling back to memory:", err);
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
}
