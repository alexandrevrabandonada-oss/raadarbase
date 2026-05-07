"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncPublicDevolutivePlanAction } from "./actions";

export function SyncPlanButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await syncPublicDevolutivePlanAction(reportId);
            setFeedback(result.ok ? result.message : result.error);
          });
        }}
      >
        {isPending ? "Sincronizando..." : "Sincronizar plano com a devolutiva"}
      </Button>
      {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}
    </div>
  );
}