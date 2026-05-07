"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  type PublicReceiptDistributionCycle,
  createReceiptDistributionCycleAction,
  startReceiptDistributionCycleAction,
  closeReceiptDistributionCycleAction
} from "@/lib/data/public-receipt-distribution";
import { type DistributionImpactSummary } from "@/lib/data/public-receipt-distribution-impact";

export function CycleManager({ 
  cycles, 
  activeImpact 
}: { 
  cycles: PublicReceiptDistributionCycle[],
  activeImpact: DistributionImpactSummary | null
}) {
  const [loading, setLoading] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setLoading(true);
    try {
      const title = formData.get("title") as string;
      await createReceiptDistributionCycleAction({ title });
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    setLoading(true);
    try {
      await startReceiptDistributionCycleAction(id);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (id: string) => {
    setLoading(true);
    try {
      await closeReceiptDistributionCycleAction(id);
    } finally {
      setLoading(false);
    }
  };

  const activeCycle = cycles.find(c => c.status === "active");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Novo Ciclo de Distribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título do Ciclo</label>
                <Input name="title" placeholder="Ex: Divulgação Maio - 1ª Onda" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Criando..." : "Criar Ciclo Planejado"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {activeCycle && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ciclo Ativo</span>
                <Badge variant="default" className="bg-yellow-600">ATIVO</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900">{activeCycle.title}</h4>
                <p className="text-xs text-slate-600 mt-1">Iniciado em: {new Date(activeCycle.starts_at!).toLocaleString("pt-BR")}</p>
              </div>
              
              {activeImpact && (
                <div className="grid grid-cols-3 gap-2 py-4 border-y border-yellow-200">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase">Relatos</p>
                    <p className="text-xl font-bold text-slate-900">+{activeImpact.delta.reportCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase">Bairros</p>
                    <p className="text-xl font-bold text-slate-900">+{activeImpact.delta.neighborhoodCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase">Pautas</p>
                    <p className="text-xl font-bold text-slate-900">+{activeImpact.delta.pautaCount}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-xs text-yellow-800">
                  Status de impacto: <span className="font-bold uppercase">{activeImpact?.status.replace(/_/g, ' ')}</span>
                </p>
                <Button variant="destructive" onClick={() => handleClose(activeCycle.id)} disabled={loading}>
                  Fechar Ciclo e Consolidar Impacto
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ciclos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cycles.map(cycle => (
              <div key={cycle.id} className="p-4 border rounded-md flex items-center justify-between bg-white shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cycle.status === "active" ? "default" : "outline"}>
                      {cycle.status.toUpperCase()}
                    </Badge>
                    <span className="font-bold">{cycle.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Criado em {new Date(cycle.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                
                {cycle.status === "planned" && (
                  <Button size="sm" onClick={() => handleStart(cycle.id)} disabled={loading}>
                    Iniciar Ciclo
                  </Button>
                )}
                
                {cycle.status === "closed" && (
                   <Button size="sm" variant="outline" onClick={() => window.open(`/api/recibo/escuta/distribuicao/export?cycleId=${cycle.id}`, '_blank')}>
                     Exportar Impacto
                   </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
