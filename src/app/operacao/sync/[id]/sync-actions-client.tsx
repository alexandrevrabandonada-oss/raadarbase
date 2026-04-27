"use client";

import { useState, useTransition } from "react";
import { markSyncRunAsFailedAction, retryMetaSyncRunAction } from "@/app/operacao/actions";
import { Button } from "@/components/ui/button";

export function SyncActionsClient({ runId, canMarkFailed }: { runId: string; canMarkFailed: boolean }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function runAction(action: "fail" | "retry") {
    setFeedback(null);
    startTransition(async () => {
      const result =
        action === "fail" ? await markSyncRunAsFailedAction(runId) : await retryMetaSyncRunAction(runId);
      setFeedback(result.ok ? result.message : result.error);
    });
  }

  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-sm font-semibold">Ações operacionais</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={pending || !canMarkFailed}
          onClick={() => runAction("fail")}
        >
          Marcar como falha
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => runAction("retry")}>
          Reprocessar com segurança
        </Button>
      </div>
      {feedback ? <p className="mt-3 text-sm text-muted-foreground">{feedback}</p> : null}
      {!canMarkFailed ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Apenas runs em andamento podem ser marcadas manualmente como falha.
        </p>
      ) : null}
    </div>
  );
}
