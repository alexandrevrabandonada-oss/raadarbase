"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Play, FileDown, Archive, ClipboardList } from "lucide-react";
import { generateMobilizationReportAction, archiveMobilizationReportAction } from "../actions";

export function ReportControls({ 
  reportId, 
  status 
}: { 
  reportId: string;
  status: string;
}) {
  const [isPending, setIsPending] = useState(false);

  async function handleGenerate() {
    setIsPending(true);
    await generateMobilizationReportAction(reportId);
    setIsPending(false);
  }

  async function handleArchive() {
    if (!confirm("Tem certeza que deseja arquivar este relatório?")) return;
    setIsPending(true);
    await archiveMobilizationReportAction(reportId);
    setIsPending(false);
  }

  function handleExport() {
    window.open(`/api/reports/${reportId}/export?format=html`, '_blank');
  }

  return (
    <div className="flex gap-2">
      {status === 'draft' && (
        <Button size="sm" onClick={handleGenerate} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Gerar Dados
        </Button>
      )}
      
      {status === 'generated' && (
        <>
          <Button
            size="sm"
            variant="default"
            className="bg-primary/90"
            nativeButton={false}
            render={<Link href={`/acoes/novo?reportId=${reportId}`} />}
          >
            <ClipboardList className="mr-2 h-4 w-4" /> Criar Plano de Ação
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={handleArchive} disabled={isPending}>
            <Archive className="mr-2 h-4 w-4" /> Arquivar
          </Button>
        </>
      )}
    </div>
  );
}
