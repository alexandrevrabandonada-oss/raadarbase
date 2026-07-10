"use client";

import { useRef, useState } from "react";
import { RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SourceActions() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function run(url: string, body?: FormData) {
    setPending(true); setMessage(null);
    try {
      const response = await fetch(url, { method: "POST", body });
      const result = await response.json() as { error?: string; total?: number; inserted?: number; updated?: number };
      if (!response.ok) throw new Error(result.error ?? "Operação recusada.");
      setMessage(`${result.total ?? 0} itens processados · ${result.inserted ?? 0} novos · ${result.updated ?? 0} atualizados.`);
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha inesperada."); }
    finally { setPending(false); }
  }
  return <div className="grid gap-4 lg:grid-cols-2">
    <form className="rounded-[4px] border-2 border-cement p-4" onSubmit={(event) => { event.preventDefault(); const file = fileRef.current?.files?.[0]; if (!file) return setMessage("Selecione um CSV ou JSON."); const body = new FormData(); body.set("file", file); void run("/api/radar/entities/import", body); }}>
      <p className="font-black">Importar arquivo legítimo</p><p className="mb-3 text-sm text-muted-foreground">CSV ou JSON pertencente ao usuário, sem coleta privada.</p><Input ref={fileRef} name="file" type="file" accept=".csv,.json,text/csv,application/json" /><Button className="mt-3" disabled={pending} type="submit"><Upload data-icon="inline-start" />Importar</Button>
    </form>
    <div className="rounded-[4px] border-2 border-cement p-4"><p className="font-black">Radar de Influência</p><p className="mb-3 text-sm text-muted-foreground">Sincroniza incrementalmente os perfis já importados e autorizados.</p><Button disabled={pending} onClick={() => void run("/api/radar/sync/instagram")}><RefreshCw data-icon="inline-start" />Sincronizar agora</Button></div>
    {message ? <p className="lg:col-span-2 rounded-[4px] border-2 border-cement bg-muted p-3 text-sm" role="status">{message}</p> : null}
  </div>;
}
