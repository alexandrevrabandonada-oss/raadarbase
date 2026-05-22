"use client";

import {
  recordDMPreparedAction,
  confirmDMSentAction,
  recordPersonResponse,
  recordPersonReferral,
  submitNeighborhoodListenObjectAction,
} from "@/app/actions";

export type OfflineTaskType =
  | "recordDMPrepared"
  | "confirmDMSent"
  | "recordResponse"
  | "recordReferral"
  | "submitNeighborhoodListen";

export type OfflineTask = {
  id: string;
  action: OfflineTaskType;
  args: any[];
  timestamp: number;
};

const STORAGE_KEY = "radar_offline_tasks_queue";

// Get tasks from localStorage
export function getOfflineTasks(): OfflineTask[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error("Failed to parse offline tasks", err);
    return [];
  }
}

// Save tasks to localStorage
function saveOfflineTasks(tasks: OfflineTask[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("Failed to save offline tasks", err);
  }
}

// Add a task to the queue
export function addOfflineTask(action: OfflineTaskType, args: any[]) {
  if (typeof window === "undefined") return;
  const tasks = getOfflineTasks();
  const newTask: OfflineTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    args,
    timestamp: Date.now(),
  };
  tasks.push(newTask);
  saveOfflineTasks(tasks);
}

// Remove a task from the queue by ID
export function removeOfflineTask(id: string) {
  const tasks = getOfflineTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  saveOfflineTasks(filtered);
}

// Execute the actual server action mapped to the key
async function runServerAction(action: OfflineTaskType, args: any[]) {
  switch (action) {
    case "recordDMPrepared":
      return await recordDMPreparedAction(args[0], args[1], args[2]);
    case "confirmDMSent":
      return await confirmDMSentAction(args[0], args[1], args[2]);
    case "recordResponse":
      return await recordPersonResponse(args[0], args[1]);
    case "recordReferral":
      return await recordPersonReferral(args[0], args[1]);
    case "submitNeighborhoodListen":
      return await submitNeighborhoodListenObjectAction(args[0]);
    default:
      throw new Error(`Unknown offline task action: ${action}`);
  }
}

// Sync all queued tasks to the server
export async function syncOfflineTasks(
  onProgress?: (current: number, total: number) => void,
  onComplete?: (successCount: number, errorCount: number) => void
) {
  const tasks = getOfflineTasks();
  if (tasks.length === 0) {
    if (onComplete) onComplete(0, 0);
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const total = tasks.length;

  // Process tasks in sequence (chronologically)
  // We make a shallow copy to iterate, modifying the actual storage as we succeed
  const sortedTasks = [...tasks].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sortedTasks.length; i++) {
    const task = sortedTasks[i];
    if (onProgress) {
      onProgress(i + 1, total);
    }

    try {
      const result = await runServerAction(task.action, task.args);
      if (result && result.ok) {
        successCount++;
        // Remove from the queue immediately upon success
        removeOfflineTask(task.id);
      } else {
        console.error(`Offline action ${task.action} failed with server error:`, result?.error);
        errorCount++;
        // In case of error (e.g. database validation), we keep it or discard it depending on business logic.
        // For state-wide campaign, we discard to prevent blocking the queue with dead tasks, but log it.
        removeOfflineTask(task.id);
      }
    } catch (err) {
      console.error(`Offline action ${task.action} failed to execute:`, err);
      errorCount++;
      removeOfflineTask(task.id);
    }
  }

  if (onComplete) {
    onComplete(successCount, errorCount);
  }
}

// Execute immediately if online, otherwise queue it
export async function executeOrQueueAction(
  action: OfflineTaskType,
  args: any[],
  toast: any
): Promise<{ ok: boolean; offline: boolean; error?: string }> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    addOfflineTask(action, args);
    toast({
      title: "Registrado Offline 💾",
      description: "Ação salva localmente. Será sincronizada quando o sinal voltar.",
    });
    return { ok: true, offline: true };
  }

  try {
    const result = await runServerAction(action, args);
    if (result && result.ok) {
      return { ok: true, offline: false };
    }
    return { ok: false, offline: false, error: result?.error || "Erro desconhecido" };
  } catch (err) {
    // If the network request failed mid-execution (looks like offline)
    addOfflineTask(action, args);
    toast({
      title: "Falha de rede - Salvo Offline 💾",
      description: "Houve uma instabilidade. A ação foi salva localmente para sincronização.",
    });
    return { ok: true, offline: true };
  }
}
