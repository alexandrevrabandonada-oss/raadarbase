"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/app/actions";
import type { IgPerson, PersonStatus } from "@/lib/types";
import {
  markContactConfirmed,
  markDoNotContact,
  markResponded,
  registerManualDm,
  updatePersonNotes,
} from "@/app/actions";

const baseMessage =
  "Oi, @{username}! Vi sua interação sobre {tema}. Obrigado por trazer isso. Se quiser, podemos conversar por DM e registrar a demanda com cuidado.";

export function PersonActions({ person, latestOutreach }: { person: IgPerson; latestOutreach: string | null }) {
  const [status, setStatus] = useState<PersonStatus>(person.status);
  const [notes, setNotes] = useState(person.notes);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const isDoNotContact = status === "nao_abordar";

  const message = useMemo(
    () => baseMessage.replace("{username}", person.username).replace("{tema}", person.themes[0] ?? "a comunidade"),
    [person],
  );

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setFeedback({ type: "success", text: "Mensagem-base copiada." });
  }

  function applyResult(result: ActionResult, successText?: string) {
    if (result.ok) {
      setFeedback({ type: "success", text: successText ?? result.message });
    } else {
      setFeedback({ type: "error", text: result.error });
    }
  }

  function syncStatus(nextStatus: PersonStatus, action: () => Promise<ActionResult>) {
    setStatus(nextStatus);
    startTransition(async () => {
      const previousStatus = status;
      const result = await action();
      if (!result.ok) {
        setStatus(previousStatus);
      }
      applyResult(result);
    });
  }

  function saveNotes() {
    startTransition(async () => {
      const result = await updatePersonNotes(person.id, notes);
      applyResult(result, "Notas salvas.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {person.themes.map((theme) => (
            <Badge key={theme} variant="secondary">{theme}</Badge>
          ))}
        </div>
        {latestOutreach ? (
          <p className="mt-3 text-sm text-muted-foreground">Ultimo registro de abordagem: {latestOutreach}</p>
        ) : null}
        {isDoNotContact ? (
          <Alert className="mt-4 border-red-800/20 bg-red-50 text-red-950">
            <AlertTitle>Nao abordar</AlertTitle>
            <AlertDescription>
              {person.doNotContactReason ?? "Esta pessoa foi marcada para nao receber novos convites ou DMs."}
            </AlertDescription>
          </Alert>
        ) : null}
        <Textarea
          className="mt-4 min-h-36"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          aria-label="Notas internas"
        />
        <Button className="mt-3" type="button" disabled={isPending} onClick={saveNotes}>
          Salvar notas
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          render={<a href={`https://instagram.com/${person.username}`} target="_blank" rel="noreferrer" />}
          variant="outline"
        >
          <ExternalLink data-icon="inline-start" />
          Abrir perfil no Instagram
        </Button>
        <Button type="button" onClick={copyMessage} variant="secondary" disabled={isPending}>
          <Copy data-icon="inline-start" />
          Copiar mensagem-base
        </Button>
        <Button type="button" onClick={() => syncStatus("abordado", () => registerManualDm(person.id))} disabled={isPending || isDoNotContact}>
          <MessageCircle data-icon="inline-start" />
          Registrar DM enviada
        </Button>
        <Button type="button" onClick={() => syncStatus("respondeu", () => markResponded(person.id))} variant="outline" disabled={isPending}>
          Marcar como respondeu
        </Button>
        <Button
          type="button"
          onClick={() => syncStatus("contato_confirmado", () => markContactConfirmed(person.id, "Instagram"))}
          className="bg-emerald-900 text-white hover:bg-emerald-950"
          disabled={isPending || isDoNotContact}
        >
          <ShieldCheck data-icon="inline-start" />
          Marcar como contato confirmado
        </Button>
        <Button type="button" onClick={() => syncStatus("nao_abordar", () => markDoNotContact(person.id))} variant="destructive" disabled={isPending}>
          Marcar como não abordar
        </Button>
      </div>
      {feedback ? (
        <p className={`text-sm ${feedback.type === "error" ? "text-red-700" : "text-emerald-700"}`}>
          {feedback.text}
        </p>
      ) : null}
      {person.contact?.consent_status === "confirmed" ? (
        <div className="rounded-md border border-emerald-700/30 bg-emerald-50 p-4 text-sm text-emerald-950">
          Consentimento registrado para {person.contact.contact_channel}: {person.contact.consent_purpose}
        </div>
      ) : null}
    </div>
  );
}
