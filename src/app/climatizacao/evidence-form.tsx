"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ClimateProtocol, ClimateSchoolOption } from "@/lib/climatizacao/data";
import { addClimateEvidenceAction } from "./actions";

export function ClimateEvidenceForm({
  schools,
  protocols,
}: {
  schools: ClimateSchoolOption[];
  protocols: ClimateProtocol[];
}) {
  const [state, action, pending] = useActionState(addClimateEvidenceAction, null);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold">
          Tipo de evidência
          <select name="evidence_type" defaultValue="official_document" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="law">Lei</option>
            <option value="official_document">Documento oficial</option>
            <option value="official_response">Resposta oficial</option>
            <option value="contract">Contrato</option>
            <option value="maintenance_order">Ordem de serviço</option>
            <option value="procurement">Compra/contratação</option>
            <option value="technical_note">Nota técnica</option>
            <option value="community_summary">Síntese comunitária</option>
            <option value="news">Notícia</option>
            <option value="other">Outro</option>
          </select>
        </label>

        <label className="text-xs font-bold">
          Tipo de fonte
          <select name="source_kind" defaultValue="official" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="official">Oficial</option>
            <option value="community">Comunidade</option>
            <option value="media">Mídia</option>
            <option value="document">Documento</option>
            <option value="other">Outro</option>
          </select>
        </label>

        <label className="text-xs font-bold">
          Status
          <select name="verification_status" defaultValue="source_seen" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="source_seen">Fonte localizada</option>
            <option value="document_verified">Documento verificado</option>
            <option value="officially_confirmed">Fonte oficial confirmada</option>
            <option value="disputed">Contestada</option>
            <option value="superseded">Substituída</option>
          </select>
        </label>

        <label className="text-xs font-bold">
          Data do documento
          <Input name="document_date" type="date" className="mt-1" />
        </label>
      </div>

      <label className="text-xs font-bold">
        Título
        <Input name="title" required maxLength={240} className="mt-1" />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-bold">
          URL da fonte
          <Input name="source_url" type="url" placeholder="https://..." className="mt-1" />
        </label>
        <label className="text-xs font-bold">
          Autoridade/origem
          <Input name="source_authority" maxLength={200} placeholder="Ex.: SME, Câmara, FEVRE..." className="mt-1" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-bold">
          Escola relacionada (opcional)
          <select name="school_id" defaultValue="" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Nenhuma escola específica</option>
            {schools.map((school) => <option key={school.id} value={school.id}>{school.name} · {school.network}</option>)}
          </select>
        </label>

        <label className="text-xs font-bold">
          Pedido/LAI relacionado (opcional)
          <select name="protocol_id" defaultValue="" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Nenhum protocolo específico</option>
            {protocols.map((protocol) => <option key={protocol.id} value={protocol.id}>{protocol.title}</option>)}
          </select>
        </label>
      </div>

      <label className="text-xs font-bold">
        Resumo público
        <Textarea name="public_note" rows={4} maxLength={1600} placeholder="Explique o que a fonte documenta, sem extrapolar o conteúdo." className="mt-1" />
      </label>

      <label className="text-xs font-bold">
        SHA-256 do arquivo (opcional)
        <Input name="content_sha256" maxLength={64} placeholder="64 caracteres hexadecimais" className="mt-1 font-mono" />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Registrando..." : "Registrar evidência"}</Button>
        {state ? <p className={state.ok ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-red-700"}>{state.ok ? state.message : state.error}</p> : null}
      </div>
    </form>
  );
}
