"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createFirstRealInstagramReportAction } from "../actions";

type FirstRealReportSnapshot = {
  totals?: {
    postsAnalyzed?: number;
    interactionsAnalyzed?: number;
    uniquePeople?: number;
    themesDetected?: number;
    pendingThemes?: number;
  };
};

export function FirstRealInstagramReportPanel({
  existingReport,
}: {
  existingReport: {
    id: string;
    title: string;
    snapshot: FirstRealReportSnapshot | null;
  } | null;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metrics = existingReport?.snapshot?.totals ?? {
    postsAnalyzed: 0,
    interactionsAnalyzed: 0,
    uniquePeople: 0,
    themesDetected: 0,
    pendingThemes: 0,
  };

  async function handleGenerate() {
    if (existingReport) {
      router.push(`/relatorios/${existingReport.id}`);
      return;
    }

    setIsPending(true);
    setError(null);

    const result = await createFirstRealInstagramReportAction();
    if (result.ok && result.reportId) {
      router.push(`/relatorios/${result.reportId}`);
      return;
    }

    setError(!result.ok ? result.error : "Falha ao gerar o primeiro relatório real.");
    setIsPending(false);
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Primeiro relatório real do Instagram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Gera uma leitura real da primeira ingestão consolidada, com foco em pautas públicas, comentários representativos e temas pendentes.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Posts" value={metrics.postsAnalyzed ?? 0} />
          <Metric label="Interações" value={metrics.interactionsAnalyzed ?? 0} />
          <Metric label="Pessoas únicas" value={metrics.uniquePeople ?? 0} />
          <Metric label="Temas" value={metrics.themesDetected ?? 0} />
          <Metric label="Pendências" value={metrics.pendingThemes ?? 0} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          {existingReport ? (
            <>
              <Button nativeButton={false} render={<Link href={`/relatorios/${existingReport.id}`} />}>Abrir relatório</Button>
              <Button variant="outline" nativeButton={false} render={<Link href={`/acoes/novo?reportId=${existingReport.id}`} />}>Criar plano público</Button>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? "Gerando..." : "Gerar primeiro relatório real"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
