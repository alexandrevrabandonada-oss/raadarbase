"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateChangeOrgIntegrationAction } from "./actions";
import type { ClimateIntegration } from "@/lib/climatizacao/data";

export function ChangeOrgIntegrationForm({ integration }: { integration: ClimateIntegration | undefined }) {
  const [state, action, pending] = useActionState(updateChangeOrgIntegrationAction, null);

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <label className="text-xs font-bold">
          URL pública da petição
          <Input
            name="public_url"
            type="url"
            defaultValue={integration?.public_url ?? ""}
            placeholder="https://www.change.org/p/..."
            className="mt-1"
          />
        </label>
        <label className="text-xs font-bold">
          Status
          <select
            name="status"
            defaultValue={integration?.status ?? "draft"}
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="draft">Rascunho</option>
            <option value="active">Ativa</option>
            <option value="disabled">Desativada</option>
          </select>
        </label>
      </div>

      <label className="text-xs font-bold">
        Texto do botão
        <Input
          name="public_label"
          defaultValue={integration?.public_label ?? "Assinar também no Change.org"}
          maxLength={120}
          className="mt-1"
        />
      </label>

      <p className="text-xs text-muted-foreground">
        O botão só aparece no site público quando a integração estiver ativa e houver uma URL válida do Change.org.
        A plataforma externa exige idade mínima de 16 anos para uso por conta própria fora dos EUA.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar integração"}</Button>
        {state ? (
          <p className={state.ok ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-red-700"}>
            {state.ok ? state.message : state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
