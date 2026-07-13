"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Instagram, LogOut, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { executeOrQueueAction } from "@/lib/offline-queue";
import {
  INSTAGRAM_RETURN_MIN_AWAY_MS,
  INSTAGRAM_RETURN_STORAGE_KEY,
  createPendingInstagramSend,
  markPendingInstagramSendAsAway,
  parsePendingInstagramSend,
  shouldConfirmPendingInstagramSend,
  type PendingInstagramSend,
} from "@/lib/instagram-return-flow";
import type { MessageTemplate, PriorityPerson } from "@/lib/types";

const quietToast = () => undefined;

type RapidQueueClientProps = {
  initialQueue: PriorityPerson[];
  templates: MessageTemplate[];
};

function savePending(pending: PendingInstagramSend | null) {
  if (pending) window.sessionStorage.setItem(INSTAGRAM_RETURN_STORAGE_KEY, JSON.stringify(pending));
  else window.sessionStorage.removeItem(INSTAGRAM_RETURN_STORAGE_KEY);
}

function loadPending() {
  return parsePendingInstagramSend(window.sessionStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY));
}

export function RapidQueueClient({ initialQueue, templates }: RapidQueueClientProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [messageByPerson, setMessageByPerson] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "away">(() =>
    typeof window !== "undefined" && loadPending() ? "away" : "idle",
  );
  const pendingRef = useRef<PendingInstagramSend | null>(null);
  const confirmingRef = useRef(false);
  const retryTimerRef = useRef<number | null>(null);

  const person = queue[index] ?? null;
  const message = person ? messageByPerson[person.id] ?? person.suggestedMessage ?? "" : "";

  const advance = useCallback((personId: string) => {
    setQueue((current) => current.filter((item) => item.id !== personId));
    setIndex((current) => Math.max(0, Math.min(current, queue.length - 2)));
    setStatus("idle");
  }, [queue.length]);

  const persistConfirmation = useCallback(async (pending: PendingInstagramSend) => {
    // A interface nunca espera a rede: a outbox mantém a confirmação até o servidor aceitar.
    return executeOrQueueAction(
      "confirmDMSent",
      [pending.personId, "minha_fila_retorno_instagram", pending.templateId],
      quietToast,
    );
  }, []);

  const confirmReturn = useCallback(() => {
    const pending = pendingRef.current ?? loadPending();
    if (!pending || confirmingRef.current || !shouldConfirmPendingInstagramSend(pending)) return;

    confirmingRef.current = true;
    pendingRef.current = null;
    savePending(null);
    const originalPerson = queue.find((item) => item.id === pending.personId);
    advance(pending.personId);
    void persistConfirmation(pending).then((result) => {
      if (result.ok || !originalPerson) return;
      setQueue((current) => current.some((item) => item.id === originalPerson.id) ? current : [originalPerson, ...current]);
      setIndex(0);
    });
  }, [advance, persistConfirmation, queue]);

  useEffect(() => {
    const restored = loadPending();
    if (restored) {
      pendingRef.current = restored;
    }

    const markAway = () => {
      const pending = pendingRef.current ?? loadPending();
      if (!pending) return;
      const updated = markPendingInstagramSendAsAway(pending);
      pendingRef.current = updated;
      savePending(updated);
    };

    const handleReturn = () => {
      const pending = pendingRef.current ?? loadPending();
      if (!pending) return;
      const remaining = Math.max(0, INSTAGRAM_RETURN_MIN_AWAY_MS - (Date.now() - (pending.leftPortalAt ?? Date.now())));
      if (remaining > 0) {
        if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = window.setTimeout(confirmReturn, remaining);
        return;
      }
      confirmReturn();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") markAway();
      else handleReturn();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", markAway);
    window.addEventListener("pageshow", handleReturn);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", markAway);
      window.removeEventListener("pageshow", handleReturn);
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    };
  }, [confirmReturn]);

  const openInstagram = useCallback(async () => {
    if (!person || !message.trim() || status !== "idle") return;
    const pending = createPendingInstagramSend(person.id, person.suggestedTemplateId ?? null);
    confirmingRef.current = false;
    pendingRef.current = pending;
    savePending(pending);
    setStatus("away");

    const copy = navigator.clipboard.writeText(message);
    window.open(`https://www.instagram.com/${person.username.replace(/^@+/, "")}/`, "_blank");
    void executeOrQueueAction("recordDMPrepared", [person.id, "minha_fila", pending.templateId], quietToast);
    try {
      await copy;
    } catch {
      // O Instagram continua aberto; a pessoa pode copiar manualmente sem perder o ciclo.
    }
  }, [message, person, status]);

  const skip = useCallback(() => {
    if (!person) return;
    setIndex((current) => Math.min(current + 1, queue.length - 1));
  }, [person, queue.length]);

  if (!person) {
    return <section className="rounded-[4px] border-2 border-cement bg-card p-6 text-center"><p className="font-black">Fila concluída.</p><Button className="mt-4" variant="outline" onClick={() => window.location.assign("/dashboard")}>Sair da fila</Button></section>;
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-[4px] border-2 border-black bg-card shadow-[4px_4px_0_0_#111]">
      <div className="border-b-2 border-black bg-charcoal p-5 text-off-white">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Próxima pessoa</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">{person.displayName || person.username}</h2>
        <p className="mt-1 font-bold text-off-white/80">@{person.username.replace(/^@+/, "")}</p>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground" htmlFor="rapid-message">Mensagem</label>
        {templates.length > 0 ? <select className="h-10 w-full rounded-[4px] border-2 border-input bg-background px-3 text-sm" defaultValue="" onChange={(event) => {
          const template = templates.find((item) => item.id === event.target.value);
          if (!template) return;
          setMessageByPerson((current) => ({ ...current, [person.id]: template.body.replaceAll("{username}", person.username.replace(/^@+/, "")) }));
        }}><option value="">Mensagem preparada</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select> : null}
        <textarea id="rapid-message" value={message} onChange={(event) => setMessageByPerson((current) => ({ ...current, [person.id]: event.target.value }))} className="min-h-44 w-full rounded-[4px] border-2 border-black bg-white p-4 text-sm leading-relaxed" />
        <Button data-testid="queue-send-instagram" size="lg" className="h-14 w-full bg-charcoal text-base font-black" onClick={openInstagram} disabled={!message.trim() || status !== "idle"}>
          <Instagram data-icon="inline-start" />{status === "away" ? "Aguardando retorno" : "Instagram"}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={skip}><SkipForward data-icon="inline-start" />Pular</Button>
          <Button variant="ghost" onClick={() => window.location.assign("/dashboard")}><LogOut data-icon="inline-start" />Sair</Button>
        </div>
      </div>
    </section>
  );
}
