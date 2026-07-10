"use client";

import { useRef, useState, useTransition } from "react";
import { RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";

export function InfluenceActions() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const importFile = () => startTransition(async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setMessage("Selecione um arquivo CSV ou JSON."); return; }
    const form = new FormData();
    form.set("file", file);
    form.set("format", file.name.toLowerCase().endsWith(".json") ? "json" : "csv");
    const response = await fetch("/api/influencia/import", { method: "POST", body: form });
    const body = await response.json() as { error?: string; inserted?: number; updated?: number };
    setMessage(response.ok ? `${body.inserted ?? 0} incluídos e ${body.updated ?? 0} atualizados.` : body.error ?? "Falha na importação.");
    if (response.ok) window.location.reload();
  });

  const scheduleUpdate = () => startTransition(async () => {
    const response = await fetch("/api/influencia/update", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ staleDays: 30, limit: 500, concurrency: 4 }) });
    const body = await response.json() as { error?: string; total_items?: number };
    setMessage(response.ok ? `${body.total_items ?? 0} perfis desatualizados adicionados à fila.` : body.error ?? "Falha ao criar fila.");
  });

  return (
    <FieldGroup className="rounded-[4px] border-2 border-cement bg-card p-4">
      <Field>
        <FieldLabel htmlFor="influence-file">Importar lista legítima</FieldLabel>
        <Input ref={fileRef} id="influence-file" type="file" accept=".csv,.json,text/csv,application/json" disabled={isPending} />
        <FieldDescription>Somente listas obtidas legitimamente. Não envie dados privados coletados sem autorização.</FieldDescription>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={importFile} disabled={isPending}>
          <Upload data-icon="inline-start" />
          Importar
        </Button>
        <Button type="button" variant="outline" onClick={scheduleUpdate} disabled={isPending}>
          <RefreshCw data-icon="inline-start" />
          Atualizar desatualizados
        </Button>
      </div>
      {message ? <p role="status" className="text-sm text-foreground">{message}</p> : null}
    </FieldGroup>
  );
}

