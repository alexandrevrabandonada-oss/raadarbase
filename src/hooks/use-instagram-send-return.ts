"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { launchInstagramProfile } from "@/lib/instagram-launch";
import {
  INSTAGRAM_RETURN_LEGACY_STORAGE_KEYS,
  INSTAGRAM_RETURN_MIN_AWAY_MS,
  INSTAGRAM_RETURN_POLL_MS,
  INSTAGRAM_RETURN_STORAGE_KEY,
  createPendingInstagramSend,
  getInstagramPortalLifecycleSignal,
  getInstagramSendOrigins,
  markPendingInstagramSendAsAway,
  parsePendingInstagramSend,
  shouldConfirmPendingInstagramSend,
  type InstagramSendSurface,
  type PendingInstagramSend,
} from "@/lib/instagram-return-flow";
import { executeOrQueueAction } from "@/lib/offline-queue";

export type InstagramSendReturnPhase = "idle" | "away" | "confirming" | "error";

export type InstagramSendInput = {
  surface: InstagramSendSurface;
  personId: string;
  templateId?: string | null;
  username?: string;
  message?: string;
};

type ConfirmationResult = { ok: boolean; offline: boolean; error?: string };

type UseInstagramSendReturnOptions = {
  enabled?: boolean;
  onConfirmed?: (pending: PendingInstagramSend, result: ConfirmationResult) => void;
  onError?: (pending: PendingInstagramSend, error: string) => void;
  toast?: (input: { title: string; description: string; variant?: "default" | "destructive" }) => void;
};

export const INSTAGRAM_CONFIRMATION_CUSTODY_EVENT = "radar:instagram-confirmation-custody";
export const INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY = "radar_instagram_confirmation_custody:v1";
const INSTAGRAM_CONFIRMATION_CUSTODY_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const quietToast = () => undefined;

let memoryPending: PendingInstagramSend | null = null;
let confirmationInFlight: Promise<ConfirmationResult> | null = null;

type ConfirmationCustodyReceipt = { personId: string; acceptedAt: number };

function forEachStorage(callback: (storage: Storage) => void) {
  for (const storageName of ["sessionStorage", "localStorage"] as const) {
    try {
      callback(window[storageName]);
    } catch {
      // O estado em memória ainda protege a navegação quando storage está bloqueado.
    }
  }
}

function parseCustodyReceipts(rawValue: string | null, now = Date.now()) {
  if (!rawValue) return [];
  try {
    const values = JSON.parse(rawValue) as Partial<ConfirmationCustodyReceipt>[];
    if (!Array.isArray(values)) return [];
    return values.filter((value): value is ConfirmationCustodyReceipt => (
      typeof value.personId === "string" &&
      value.personId.length > 0 &&
      typeof value.acceptedAt === "number" &&
      now - value.acceptedAt >= 0 &&
      now - value.acceptedAt <= INSTAGRAM_CONFIRMATION_CUSTODY_MAX_AGE_MS
    ));
  } catch {
    return [];
  }
}

export function getInstagramConfirmationCustodyIds(now = Date.now()) {
  const receipts = new Map<string, ConfirmationCustodyReceipt>();
  forEachStorage((storage) => {
    for (const receipt of parseCustodyReceipts(
      storage.getItem(INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY),
      now,
    )) {
      const current = receipts.get(receipt.personId);
      if (!current || current.acceptedAt < receipt.acceptedAt) receipts.set(receipt.personId, receipt);
    }
  });
  const currentReceipts = [...receipts.values()];
  const serialized = JSON.stringify(currentReceipts);
  forEachStorage((storage) => storage.setItem(INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY, serialized));
  return new Set(receipts.keys());
}

function recordInstagramConfirmationCustody(personId: string, acceptedAt = Date.now()) {
  const receipts = new Map<string, ConfirmationCustodyReceipt>();
  forEachStorage((storage) => {
    for (const receipt of parseCustodyReceipts(
      storage.getItem(INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY),
      acceptedAt,
    )) receipts.set(receipt.personId, receipt);
  });
  receipts.set(personId, { personId, acceptedAt });
  const serialized = JSON.stringify([...receipts.values()]);
  forEachStorage((storage) => storage.setItem(INSTAGRAM_CONFIRMATION_CUSTODY_STORAGE_KEY, serialized));
}

export function persistInstagramSendPending(
  pending: PendingInstagramSend | null,
) {
  memoryPending = pending;
  const value = pending ? JSON.stringify(pending) : null;
  forEachStorage((storage) => {
    if (value) storage.setItem(INSTAGRAM_RETURN_STORAGE_KEY, value);
    else storage.removeItem(INSTAGRAM_RETURN_STORAGE_KEY);
  });
}

export function loadInstagramSendPending(now = Date.now()) {
  const candidates: PendingInstagramSend[] = [];
  if (memoryPending) {
    const parsed = parsePendingInstagramSend(JSON.stringify(memoryPending), now);
    if (parsed) candidates.push(parsed);
  }

  forEachStorage((storage) => {
    const rawCurrent = storage.getItem(INSTAGRAM_RETURN_STORAGE_KEY);
    const current = parsePendingInstagramSend(rawCurrent, now);
    if (current) candidates.push(current);
    else if (rawCurrent) storage.removeItem(INSTAGRAM_RETURN_STORAGE_KEY);

    for (const [surface, key] of Object.entries(INSTAGRAM_RETURN_LEGACY_STORAGE_KEYS)) {
      const migrated = parsePendingInstagramSend(
        storage.getItem(key),
        now,
        surface as InstagramSendSurface,
      );
      if (migrated) candidates.push(migrated);
      storage.removeItem(key);
    }
  });

  const selected = candidates.sort((a, b) => b.openedAt - a.openedAt)[0] ?? null;
  if (selected) persistInstagramSendPending(selected);
  else if (memoryPending) persistInstagramSendPending(null);
  return selected;
}

export function useInstagramSendReturn({
  enabled = true,
  onConfirmed,
  onError,
  toast = quietToast,
}: UseInstagramSendReturnOptions = {}) {
  const [phase, setPhase] = useState<InstagramSendReturnPhase>("idle");
  const [pending, setPending] = useState<PendingInstagramSend | null>(null);
  const pendingRef = useRef<PendingInstagramSend | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const portalInactiveRef = useRef(false);
  const watchdogTickRef = useRef(0);
  const callbacksRef = useRef({ onConfirmed, onError, toast });

  useEffect(() => {
    callbacksRef.current = { onConfirmed, onError, toast };
  }, [onConfirmed, onError, toast]);

  const updatePending = useCallback((next: PendingInstagramSend | null) => {
    pendingRef.current = next;
    setPending(next);
    persistInstagramSendPending(next);
    setPhase(next ? "away" : "idle");
  }, []);

  const confirmPending = useCallback(async (target: PendingInstagramSend) => {
    if (confirmationInFlight) return confirmationInFlight;

    setPhase("confirming");
    const origins = getInstagramSendOrigins(target.surface);
    confirmationInFlight = executeOrQueueAction(
      "confirmDMSent",
      [target.personId, origins.confirmed, target.templateId],
      callbacksRef.current.toast,
    );

    let result: ConfirmationResult;
    try {
      result = await confirmationInFlight;
    } catch {
      result = { ok: false, offline: false, error: "Falha inesperada ao registrar o envio." };
    } finally {
      confirmationInFlight = null;
    }

    if (!result.ok) {
      setPhase("error");
      callbacksRef.current.onError?.(target, result.error ?? "Não foi possível registrar o envio.");
      return result;
    }

    // A custódia já pertence ao servidor ou à outbox. Só agora removemos o pendente.
    pendingRef.current = null;
    setPending(null);
    persistInstagramSendPending(null);
    setPhase("idle");
    recordInstagramConfirmationCustody(target.personId);
    window.dispatchEvent(new CustomEvent(INSTAGRAM_CONFIRMATION_CUSTODY_EVENT, {
      detail: { personId: target.personId, offline: result.offline },
    }));
    callbacksRef.current.onConfirmed?.(target, result);
    return result;
  }, []);

  const confirmNow = useCallback(async (input?: InstagramSendInput) => {
    let target = pendingRef.current ?? loadInstagramSendPending();
    if (input) {
      if (target && target.personId !== input.personId) {
        const result = { ok: false, offline: false, error: "Conclua o envio pendente antes de registrar outra pessoa." };
        callbacksRef.current.onError?.(target, result.error);
        return result;
      }
      if (!target) {
        target = markPendingInstagramSendAsAway(createPendingInstagramSend(
          input.personId,
          input.templateId ?? null,
          input.surface,
        ));
        updatePending(target);
      }
    }
    if (!target) return { ok: false, offline: false, error: "Nenhum envio pendente." };
    pendingRef.current = target;
    setPending(target);
    return confirmPending(target);
  }, [confirmPending, updatePending]);

  const retryConfirmation = useCallback(() => confirmNow(), [confirmNow]);

  const confirmWhenReady = useCallback(() => {
    const target = pendingRef.current ?? loadInstagramSendPending();
    if (!target) return;
    pendingRef.current = target;
    setPending(target);
    setPhase((current) => current === "error" ? current : "away");
    if (!shouldConfirmPendingInstagramSend(target)) return;
    void confirmPending(target);
  }, [confirmPending]);

  const scheduleConfirmation = useCallback(() => {
    const target = pendingRef.current ?? loadInstagramSendPending();
    if (!target?.leftPortalAt) return;
    const remaining = Math.max(0, INSTAGRAM_RETURN_MIN_AWAY_MS - (Date.now() - target.leftPortalAt));
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    retryTimerRef.current = window.setTimeout(confirmWhenReady, remaining);
  }, [confirmWhenReady]);

  const openInstagram = useCallback(async (input: InstagramSendInput) => {
    const existing = pendingRef.current ?? loadInstagramSendPending();
    if (existing) {
      const error = existing.personId === input.personId
        ? "Este envio já está aguardando confirmação."
        : "Conclua o envio pendente antes de abrir outra pessoa.";
      setPhase("error");
      callbacksRef.current.onError?.(existing, error);
      return { ok: false, copied: false, error };
    }
    if (!input.username || !input.message?.trim()) {
      return { ok: false, copied: false, error: "Mensagem ou usuário do Instagram ausente." };
    }

    const next = markPendingInstagramSendAsAway(createPendingInstagramSend(
      input.personId,
      input.templateId ?? null,
      input.surface,
    ));
    portalInactiveRef.current = false;
    watchdogTickRef.current = Date.now();
    updatePending(next);

    let copySucceeded: Promise<boolean>;
    try {
      copySucceeded = navigator.clipboard?.writeText
        ? navigator.clipboard.writeText(input.message).then(() => true, () => false)
        : Promise.resolve(false);
    } catch {
      copySucceeded = Promise.resolve(false);
    }
    const origins = getInstagramSendOrigins(input.surface);
    void executeOrQueueAction(
      "recordDMPrepared",
      [input.personId, origins.prepared, input.templateId ?? null],
      callbacksRef.current.toast,
    ).then((result) => {
      if (!result.ok) {
        callbacksRef.current.toast({
          title: "Preparação pendente",
          description: result.error ?? "A abertura foi preservada para nova tentativa.",
          variant: "destructive",
        });
      }
    });
    launchInstagramProfile(input.username);

    const copied = await copySucceeded;
    return copied
      ? { ok: true, copied: true }
      : { ok: true, copied: false, error: "O Instagram foi aberto, mas a cópia automática falhou." };
  }, [updatePending]);

  useEffect(() => {
    if (!enabled) return;

    const restored = loadInstagramSendPending();
    pendingRef.current = restored;
    // Restauração de um sistema externo persistido; precisa ocorrer após a hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(restored);
    setPhase(restored ? "away" : "idle");

    const syncPending = () => {
      // Em outra aba, o storage é a fonte mais recente; não ressuscite a cópia
      // em memória que existia antes do evento.
      memoryPending = null;
      const next = loadInstagramSendPending();
      pendingRef.current = next;
      setPending(next);
      if (!next) setPhase("idle");
    };
    const markAway = () => {
      const current = pendingRef.current ?? loadInstagramSendPending();
      if (!current) return;
      portalInactiveRef.current = true;
      const next = markPendingInstagramSendAsAway(current);
      pendingRef.current = next;
      setPending(next);
      persistInstagramSendPending(next);
    };
    const handleReturn = () => {
      portalInactiveRef.current = false;
      scheduleConfirmation();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") markAway();
      else handleReturn();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", markAway);
    window.addEventListener("focus", handleReturn);
    window.addEventListener("pagehide", markAway);
    window.addEventListener("pageshow", handleReturn);
    document.addEventListener("freeze", markAway);
    document.addEventListener("resume", handleReturn);
    window.addEventListener("storage", syncPending);

    watchdogTickRef.current = Date.now();
    const watchdog = window.setInterval(() => {
      const now = Date.now();
      const elapsedSinceLastCheck = now - watchdogTickRef.current;
      watchdogTickRef.current = now;
      if (!(pendingRef.current ?? loadInstagramSendPending())) {
        portalInactiveRef.current = false;
        return;
      }
      const signal = getInstagramPortalLifecycleSignal({
        visibilityState: document.visibilityState,
        hasFocus: document.hasFocus(),
        observedInactive: portalInactiveRef.current,
        elapsedSinceLastCheck,
      });
      if (signal === "away") markAway();
      if (signal === "returned") handleReturn();
    }, INSTAGRAM_RETURN_POLL_MS);

    handleReturn();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", markAway);
      window.removeEventListener("focus", handleReturn);
      window.removeEventListener("pagehide", markAway);
      window.removeEventListener("pageshow", handleReturn);
      document.removeEventListener("freeze", markAway);
      document.removeEventListener("resume", handleReturn);
      window.removeEventListener("storage", syncPending);
      window.clearInterval(watchdog);
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    };
  }, [enabled, scheduleConfirmation]);

  return {
    phase,
    pending,
    pendingPersonId: pending?.personId ?? null,
    openInstagram,
    confirmNow,
    retryConfirmation,
  };
}

export type InstagramSendReturnController = ReturnType<typeof useInstagramSendReturn>;
