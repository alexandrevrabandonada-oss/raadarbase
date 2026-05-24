"use client";

import {
  recordDMPreparedAction,
  confirmDMSentAction,
  recordPersonResponse,
  recordPersonReferral,
  submitNeighborhoodListenObjectAction,
} from "@/app/actions";
import type { ActionResult } from "@/app/actions/utils";
import type { NeighborhoodListenPayload } from "@/app/escuta/bairro/actions";
import type { PersonReferralType, PersonResponseKind } from "@/lib/types";

export type OfflineTaskType =
  | "recordDMPrepared"
  | "confirmDMSent"
  | "recordResponse"
  | "recordReferral"
  | "submitNeighborhoodListen";

type OfflineTaskArgsMap = {
  recordDMPrepared: [personId: string, origin: string, templateId?: string | null];
  confirmDMSent: [personId: string, origin: string, templateId?: string | null];
  recordResponse: [personId: string, responseType: PersonResponseKind];
  recordReferral: [personId: string, target: PersonReferralType];
  submitNeighborhoodListen: [payload: NeighborhoodListenPayload];
};

export type OfflineTask = {
  [K in OfflineTaskType]: {
    id: string;
    action: K;
    args: OfflineTaskArgsMap[K];
    timestamp: number;
  };
}[OfflineTaskType];

type OfflineToast = (input: {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}) => void;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }
    const request = window.indexedDB.open("radar_offline_db", 1);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("tasks")) {
        db.createObjectStore("tasks", { keyPath: "id" });
      }
    };
  });
}

// Get tasks from IndexedDB (ordered chronologically)
export async function getOfflineTasks(): Promise<OfflineTask[]> {
  if (typeof window === "undefined" || !window.indexedDB) return [];
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("tasks", "readonly");
      const store = transaction.objectStore("tasks");
      const request = store.getAll();

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.sort((a, b) => a.timestamp - b.timestamp));
      };
    });
  } catch (err) {
    console.error("Failed to read from IndexedDB", err);
    return [];
  }
}

// Add a task to the queue
export async function addOfflineTask<T extends OfflineTaskType>(action: T, args: OfflineTaskArgsMap[T]): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return;
  try {
    const db = await openDB();
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      args,
      timestamp: Date.now(),
    } as OfflineTask;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("tasks", "readwrite");
      const store = transaction.objectStore("tasks");
      const request = store.add(newTask);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (err) {
    console.error("Failed to add task to IndexedDB", err);
  }
}

// Remove a task from the queue by ID
export async function removeOfflineTask(id: string): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("tasks", "readwrite");
      const store = transaction.objectStore("tasks");
      const request = store.delete(id);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (err) {
    console.error("Failed to delete task from IndexedDB", err);
  }
}

// Execute the actual server action mapped to the key
async function runServerAction(task: OfflineTask): Promise<ActionResult> {
  switch (task.action) {
    case "recordDMPrepared":
      return await recordDMPreparedAction(task.args[0], task.args[1], task.args[2]);
    case "confirmDMSent":
      return await confirmDMSentAction(task.args[0], task.args[1], task.args[2]);
    case "recordResponse":
      return await recordPersonResponse(task.args[0], task.args[1]);
    case "recordReferral":
      return await recordPersonReferral(task.args[0], task.args[1]);
    case "submitNeighborhoodListen":
      return await submitNeighborhoodListenObjectAction(task.args[0]);
    default:
      throw new Error("Unknown offline task action");
  }
}

// Sync all queued tasks to the server
export async function syncOfflineTasks(
  onProgress?: (current: number, total: number) => void,
  onComplete?: (successCount: number, errorCount: number) => void
) {
  const tasks = await getOfflineTasks();
  if (tasks.length === 0) {
    if (onComplete) onComplete(0, 0);
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const total = tasks.length;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (onProgress) {
      onProgress(i + 1, total);
    }

    try {
      const result = await runServerAction(task);
      if (result && result.ok) {
        successCount++;
        // Remove from the queue immediately upon success
        await removeOfflineTask(task.id);
      } else {
        console.error(`Offline action ${task.action} failed with server error:`, result?.error);
        errorCount++;
        // In case of error (e.g. database validation), we keep it or discard it depending on business logic.
        // For state-wide campaign, we discard to prevent blocking the queue with dead tasks, but log it.
        await removeOfflineTask(task.id);
      }
    } catch (err) {
      console.error(`Offline action ${task.action} failed to execute:`, err);
      errorCount++;
      await removeOfflineTask(task.id);
    }
  }

  if (onComplete) {
    onComplete(successCount, errorCount);
  }
}

// Execute immediately if online, otherwise queue it
export async function executeOrQueueAction<T extends OfflineTaskType>(
  action: T,
  args: OfflineTaskArgsMap[T],
  toast: OfflineToast
): Promise<{ ok: boolean; offline: boolean; error?: string }> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    await addOfflineTask(action, args);
    toast({
      title: "Registrado Offline 💾",
      description: "Ação salva localmente. Será sincronizada quando o sinal voltar.",
    });
    return { ok: true, offline: true };
  }

  try {
    const result = await runServerAction({
      id: "immediate",
      action,
      args,
      timestamp: Date.now(),
    } as OfflineTask);
    if (result && result.ok) {
      return { ok: true, offline: false };
    }
    return { ok: false, offline: false, error: result?.error || "Erro desconhecido" };
  } catch {
    // If the network request failed mid-execution (looks like offline)
    await addOfflineTask(action, args);
    toast({
      title: "Falha de rede - Salvo Offline 💾",
      description: "Houve uma instabilidade. A ação foi salva localmente para sincronização.",
    });
    return { ok: true, offline: true };
  }
}
