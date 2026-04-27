"use client";

import { useState, useTransition } from "react";
import { RefreshCcw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionResult } from "@/app/actions";
import {
  syncMetaAccountSnapshotAction,
  syncMetaMediaAction,
  syncMetaRecentCommentsAction,
} from "./actions";

type Run = {
  id: string;
  kind: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_message: string | null;
};

export function MetaSyncClient({
  status,
  runs,
}: {
  status: { graphVersion: boolean; instagramBusinessAccountId: boolean; accessToken: boolean };
  runs: Run[];
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ActionResult | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setFeedback(null);
    startTransition(async () => {
      setFeedback(await action());
    });
  }

  const configured = status.graphVersion && status.instagramBusinessAccountId && status.accessToken;
  const latest = runs[0];
  const latestError = runs.find((item) => item.status === "error");

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Sincronização manual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!configured ? (
            <Alert className="border-yellow-500/40 bg-yellow-100 text-black">
              <ShieldCheck data-icon="inline-start" />
              <AlertTitle>Integração Meta não configurada</AlertTitle>
              <AlertDescription>Preencha as variáveis no servidor para habilitar a sincronização manual.</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-semibold">Graph version</p>
              <p className="text-sm text-muted-foreground">{status.graphVersion ? "Configurado" : "Ausente"}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-semibold">Conta Instagram</p>
              <p className="text-sm text-muted-foreground">{status.instagramBusinessAccountId ? "Configurada" : "Ausente"}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-semibold">Token no servidor</p>
              <p className="text-sm text-muted-foreground">{status.accessToken ? "Presente" : "Ausente"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pending || !configured} onClick={() => run(syncMetaAccountSnapshotAction)}>
              <RefreshCcw data-icon="inline-start" />
              Sincronizar dados da conta
            </Button>
            <Button type="button" disabled={pending || !configured} onClick={() => run(syncMetaMediaAction)} variant="secondary">
              Sincronizar últimos posts
            </Button>
            <Button type="button" disabled={pending || !configured} onClick={() => run(syncMetaRecentCommentsAction)} variant="outline">
              Sincronizar comentários dos posts recentes
            </Button>
          </div>
          {feedback ? (
            <Alert className={feedback.ok ? "border-emerald-700/30 bg-emerald-50 text-emerald-950" : "border-red-800/20 bg-red-50 text-red-950"}>
              <AlertTitle>{feedback.ok ? "Sincronização concluída" : "Falha na sincronização"}</AlertTitle>
              <AlertDescription>{feedback.ok ? feedback.message : feedback.error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Histórico recente</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="rounded-md border bg-background p-3">
            <p className="text-sm font-semibold">Última sincronização</p>
            <p className="text-sm text-muted-foreground">{latest ? `${latest.kind} - ${latest.status}` : "Sem registro"}</p>
          </div>
          <div className="rounded-md border bg-background p-3">
            <p className="text-sm font-semibold">Último erro</p>
            <p className="text-sm text-muted-foreground">{latestError?.error_message ?? "Sem erro registrado"}</p>
          </div>
          {runs.map((run) => (
            <div key={run.id} className="rounded-md border bg-background p-3 text-sm">
              <p className="font-semibold">{run.kind}</p>
              <p className="text-muted-foreground">{run.status} - inseridos {run.inserted_count}, atualizados {run.updated_count}, ignorados {run.skipped_count}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
