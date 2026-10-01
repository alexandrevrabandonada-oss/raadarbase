"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  ClimateCaseOps,
  ClimateCaseOpsItem,
  ClimateEvidence,
  ClimateProtocol,
} from "@/lib/climatizacao/data";
import {
  linkClimateCaseEvidenceAction,
  linkClimateCaseProtocolAction,
  reviewEvidenceSubmissionAction,
  updateClimateCaseStatusAction,
} from "./actions";

const issueLabels: Record<string,string>={
  sem_ar:"Sem ar-condicionado",
  nao_funciona:"Aparelho não funciona",
  parcial:"Climatização parcial",
  rede_eletrica:"Rede elétrica / subestação",
  manutencao:"Manutenção",
  outro:"Outro",
};

const statusLabels: Record<string,string>={
  reported:"Relatado",
  documenting:"Documentando",
  official_request:"Cobrança preparada",
  awaiting_response:"Aguardando resposta",
  answered:"Respondido",
  resolved:"Resolvido",
  reopened:"Reaberto",
};

function Feedback({state}:{state:{ok:true;message:string}|{ok:false;error:string}|null}){
  if(!state) return null;
  return <p className={state.ok?"text-xs font-semibold text-emerald-700":"text-xs font-semibold text-red-700"}>
    {state.ok?state.message:state.error}
  </p>;
}

function CaseStatusForm({item}:{item:ClimateCaseOpsItem}){
  const [state,action,pending]=useActionState(updateClimateCaseStatusAction,null);
  return <form action={action} className="grid gap-2 rounded-md border bg-muted/20 p-3">
    <input type="hidden" name="case_id" value={item.id}/>
    <label className="text-xs font-bold">Status
      <select name="status" defaultValue={item.status} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm">
        <option value="reported">Relatado</option>
        <option value="documenting">Documentando</option>
        <option value="official_request">Cobrança preparada</option>
        <option value="awaiting_response">Aguardando resposta</option>
        <option value="answered">Respondido</option>
        <option value="resolved">Resolvido</option>
        <option value="reopened">Reaberto</option>
      </select>
    </label>
    <label className="text-xs font-bold">Nota pública
      <Textarea name="public_note" rows={3} defaultValue={item.public_note??""} maxLength={1600} className="mt-1"/>
    </label>
    <div className="flex flex-wrap items-center gap-2">
      <Button type="submit" size="sm" disabled={pending}>{pending?"Salvando...":"Atualizar caso"}</Button>
      <Feedback state={state}/>
    </div>
  </form>;
}

function SubmissionCard({item}:{item:ClimateCaseOps["pendingSubmissions"][number]}){
  const [state,action,pending]=useActionState(reviewEvidenceSubmissionAction,null);
  return <form action={action} className="rounded-md border p-4">
    <input type="hidden" name="submission_id" value={item.id}/>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          {item.school_name} · {item.school_network}
        </p>
        <h4 className="mt-1 font-bold">{item.title}</h4>
      </div>
      <Badge variant="outline">{item.source_kind}</Badge>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">
      Problema: {item.issue?issueLabels[item.issue]??item.issue:"geral"} · recebido em {new Date(item.created_at).toLocaleString("pt-BR")}
    </p>
    {item.public_note?<p className="mt-2 whitespace-pre-wrap text-sm">{item.public_note}</p>:null}
    <a href={item.source_url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs font-semibold underline">
      {item.source_url}
    </a>
    <label className="mt-3 block text-xs font-bold">Nota de revisão
      <Textarea name="review_note" rows={2} maxLength={1200} className="mt-1"/>
    </label>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button type="submit" name="decision" value="accepted" size="sm" disabled={pending}>Aceitar e publicar</Button>
      <Button type="submit" name="decision" value="rejected" size="sm" variant="outline" disabled={pending}>Rejeitar</Button>
      <Feedback state={state}/>
    </div>
  </form>;
}

export function ClimateCaseOpsPanel({
  caseOps,
  evidence,
  protocols,
}:{
  caseOps:ClimateCaseOps;
  evidence:ClimateEvidence[];
  protocols:ClimateProtocol[];
}){
  const [evidenceState,evidenceAction,evidencePending]=useActionState(linkClimateCaseEvidenceAction,null);
  const [protocolState,protocolAction,protocolPending]=useActionState(linkClimateCaseProtocolAction,null);

  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-md border p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Casos</p><p className="mt-1 text-3xl font-black">{caseOps.cases.length}</p></div>
      <div className="rounded-md border p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pendentes de revisão</p><p className="mt-1 text-3xl font-black">{caseOps.pendingSubmissions.length}</p></div>
      <div className="rounded-md border p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resolvidos</p><p className="mt-1 text-3xl font-black">{caseOps.cases.filter(item=>item.status==="resolved").length}</p></div>
    </div>

    <div className="grid gap-3 xl:grid-cols-2">
      {caseOps.cases.map(item=><div key={item.id} className="rounded-lg border p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">{item.school_name} · {item.school_network}</p>
            <h3 className="mt-1 text-lg font-black">{issueLabels[item.issue]??item.issue}</h3>
            <p className="text-xs text-muted-foreground">{item.report_count} relato(s) · {item.evidence_count} evidência(s) · {item.protocol_count} protocolo(s)</p>
          </div>
          <Badge variant="outline">{statusLabels[item.status]??item.status}</Badge>
        </div>
        <CaseStatusForm item={item}/>
      </div>)}
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <form action={evidenceAction} className="grid gap-3 rounded-lg border p-4">
        <h3 className="font-black">Vincular evidência a caso</h3>
        <select name="case_id" required defaultValue="" className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="" disabled>Escolha o caso</option>
          {caseOps.cases.map(item=><option key={item.id} value={item.id}>{item.school_name} · {issueLabels[item.issue]??item.issue}</option>)}
        </select>
        <select name="evidence_id" required defaultValue="" className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="" disabled>Escolha a evidência</option>
          {evidence.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={evidencePending}>{evidencePending?"Vinculando...":"Vincular evidência"}</Button>
          <Feedback state={evidenceState}/>
        </div>
      </form>

      <form action={protocolAction} className="grid gap-3 rounded-lg border p-4">
        <h3 className="font-black">Vincular protocolo a caso</h3>
        <select name="case_id" required defaultValue="" className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="" disabled>Escolha o caso</option>
          {caseOps.cases.map(item=><option key={item.id} value={item.id}>{item.school_name} · {issueLabels[item.issue]??item.issue}</option>)}
        </select>
        <select name="protocol_id" required defaultValue="" className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="" disabled>Escolha o protocolo</option>
          {protocols.map(item=><option key={item.id} value={item.id}>{item.title} · {item.status}</option>)}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={protocolPending}>{protocolPending?"Vinculando...":"Vincular protocolo"}</Button>
          <Feedback state={protocolState}/>
        </div>
      </form>
    </div>

    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-black">Fontes sugeridas pela comunidade</h3>
        <p className="text-sm text-muted-foreground">Nada abaixo é público até ser aceito.</p>
      </div>
      {caseOps.pendingSubmissions.length===0?<p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Nenhuma sugestão pendente.</p>:
        caseOps.pendingSubmissions.map(item=><SubmissionCard key={item.id} item={item}/>)}
    </div>
  </div>;
}
