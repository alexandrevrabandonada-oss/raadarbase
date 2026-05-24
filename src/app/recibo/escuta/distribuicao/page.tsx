import AppShell from "@/components/app-shell";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { 
  listReceiptDistributionCycles, 
  listReceiptDistributionLogs 
} from "@/lib/data/public-receipt-distribution";
import { getReceiptDistributionImpact } from "@/lib/data/public-receipt-distribution-impact";
import { CycleManager } from "./cycle-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DistributionManagementPage() {
  await requireInternalPageSession("/recibo/escuta/distribuicao");
  
  const cycles = await listReceiptDistributionCycles();
  const logs = await listReceiptDistributionLogs();
  
  const activeCycle = cycles.find(c => c.status === "active");
  const activeImpact = activeCycle ? await getReceiptDistributionImpact(activeCycle.id) : null;
  
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Gestão de Distribuição</h1>
        <p className="text-slate-600 mt-2">
          Acompanhe o impacto das ondas de divulgação manual do Recibo da Escuta.
        </p>
      </div>

      <CycleManager cycles={cycles} activeImpact={activeImpact} />

      <div className="mt-8 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Canais e Logs do Ciclo Ativo</h2>
        {activeCycle ? (
          <div className="grid gap-4">
            {logs.filter(l => l.cycle_id === activeCycle.id).length === 0 ? (
               <p className="text-sm text-muted-foreground italic">Nenhum log vinculado a este ciclo ainda. Vincule logs na página principal do recibo.</p>
            ) : (
              logs.filter(l => l.cycle_id === activeCycle.id).map(log => (
                <Card key={log.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.channel}</Badge>
                        <span className="text-sm font-medium">{log.notes || "Sem notas"}</span>
                      </div>
                      {log.public_url && (
                        <a href={log.public_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                          Link Público
                        </a>
                      )}
                    </div>
                    <Badge variant={log.status === "shared" ? "default" : "outline"}>
                      {log.status === "shared" ? "COMPARTILHADO" : "PLANEJADO"}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Inicie um ciclo para visualizar os logs vinculados.</p>
        )}
      </div>

      <div className="mt-12 bg-slate-50 border p-6 rounded-lg">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <span className="text-xl">🛡️</span> Guardrails de Distribuição
        </h3>
        <ul className="text-sm text-slate-700 mt-4 space-y-2 list-disc list-inside">
          <li>Toda distribuição deve ser realizada **manualmente** pelo operador.</li>
          <li>O registro da URL pública é essencial para auditoria de transparência.</li>
          <li>Não utilize automações para envio de DMs ou postagens.</li>
          <li>Os dados de impacto são estritamente **agregados**.</li>
          <li>Se o ciclo fechar sem retorno, considere criar uma ação corretiva de &quot;Reforço de Escuta&quot;.</li>
        </ul>
      </div>
    </AppShell>
  );
}
