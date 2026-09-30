"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  submitClimateProtocolAction,
  extendClimateProtocolAction,
  answerClimateProtocolAction,
} from "./actions";
import type { ClimateProtocol } from "@/lib/climatizacao/data";

function Feedback({ state }: { state: { ok: true; message: string } | { ok: false; error: string } | null }) {
  if (!state) return null;
  return (
    <p className={state.ok ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-red-700"}>
      {state.ok ? state.message : state.error}
    </p>
  );
}

export function ClimateProtocolActions({ protocol }: { protocol: ClimateProtocol }) {
  const [submitState, submitAction, submitting] = useActionState(submitClimateProtocolAction, null);
  const [extendState, extendAction, extending] = useActionState(extendClimateProtocolAction, null);
  const [answerState, answerAction, answering] = useActionState(answerClimateProtocolAction, null);

  if (protocol.status === "draft") {
    return (
      <form action={submitAction} className="grid gap-3 rounded-md border bg-muted/30 p-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={protocol.id} />
        <label className="text-xs font-bold">
          Número do protocolo
          <Input name="protocol_number" placeholder="Ex.: 01234.2026..." required className="mt-1" />
        </label>
        <label className="text-xs font-bold">
          Data/hora do envio
          <Input name="submitted_at" type="datetime-local" className="mt-1" />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? "Registrando..." : "Marcar como protocolado"}</Button>
          <Feedback state={submitState} />
        </div>
      </form>
    );
  }

  if (protocol.status === "answered" || protocol.status === "closed") {
    return protocol.response_summary ? (
      <div className="rounded-md border bg-emerald-50 p-4 text-sm">
        <p className="font-bold">Resposta registrada</p>
        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{protocol.response_summary}</p>
        {protocol.response_url ? (
          <a className="mt-2 inline-block font-semibold underline" href={protocol.response_url} target="_blank" rel="noreferrer">
            Abrir resposta
          </a>
        ) : null}
      </div>
    ) : null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <form action={extendAction} className="grid gap-3 rounded-md border bg-muted/30 p-4">
        <input type="hidden" name="id" value={protocol.id} />
        <label className="text-xs font-bold">
          Justificativa da prorrogação
          <Textarea name="note" rows={3} placeholder="Cole ou resuma a justificativa informada pelo órgão." className="mt-1" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" disabled={extending}>{extending ? "Registrando..." : "Registrar prorrogação"}</Button>
          <Feedback state={extendState} />
        </div>
      </form>

      <form action={answerAction} className="grid gap-3 rounded-md border bg-muted/30 p-4">
        <input type="hidden" name="id" value={protocol.id} />
        <label className="text-xs font-bold">
          Link da resposta
          <Input name="response_url" type="url" placeholder="https://..." className="mt-1" />
        </label>
        <label className="text-xs font-bold">
          Resumo público da resposta
          <Textarea name="response_summary" rows={4} required className="mt-1" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={answering}>{answering ? "Salvando..." : "Registrar resposta"}</Button>
          <Feedback state={answerState} />
        </div>
      </form>
    </div>
  );
}
