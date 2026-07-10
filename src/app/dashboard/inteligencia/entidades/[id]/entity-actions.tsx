"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EntityActions({ entityId }: { entityId: string }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [message, setMessage] = useState<string | null>(null); const [note, setNote] = useState("");
  async function post(url: string, body?: unknown) {
    setPending(true); setMessage(null);
    try { const response = await fetch(url, { method: "POST", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error ?? "Operação recusada."); setMessage("Operação concluída."); router.refresh(); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "Falha inesperada."); return false; }
    finally { setPending(false); }
  }
  return <div className="space-y-4"><div className="flex flex-wrap gap-2"><Button disabled={pending} onClick={() => void post("/api/radar/entities/enrich", { entityIds: [entityId], sourceTypes: ["radar_base"], mode: "safe", processNow: true })}><RefreshCw data-icon="inline-start" />Recalcular score</Button><Button variant="outline" disabled={pending} onClick={() => void post("/api/radar/entities/enrich", { entityIds: [entityId], sourceTypes: ["radar_base"], mode: "manual_review", processNow: true })}>Revisar identidade</Button></div><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!note.trim()) return; void post(`/api/radar/entities/${entityId}/notes`, { body: note }).then((ok) => { if (ok) setNote(""); }); }}><Input aria-label="Nova observação" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Adicionar observação auditável" maxLength={2000} /><Button type="submit" disabled={pending || !note.trim()}>Salvar</Button></form>{message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}</div>;
}

export function MergeActions({ suggestionId }: { suggestionId: string }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [message, setMessage] = useState<string | null>(null);
  async function decide(decision: "approve" | "reject") { setPending(true); const response = await fetch(`/api/radar/merge-suggestions/${suggestionId}/${decision}`, { method: "POST" }); const result = await response.json() as { error?: string }; setMessage(response.ok ? "Revisão registrada." : result.error ?? "Falha na revisão."); setPending(false); if (response.ok) router.refresh(); }
  return <div className="flex items-center gap-2"><Button size="sm" disabled={pending} onClick={() => void decide("approve")}><Check data-icon="inline-start" />Aprovar vínculo</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => void decide("reject")}><X data-icon="inline-start" />Rejeitar</Button>{message ? <span className="text-xs text-muted-foreground">{message}</span> : null}</div>;
}
