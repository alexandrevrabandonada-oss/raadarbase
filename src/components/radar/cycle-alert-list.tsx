import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  Landmark,
  Heart,
  Users,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OperationalCycleAlert } from "@/lib/data/operational-cycle-alerts";

const iconByAlert = {
  vinculo_travado: GitBranch,
  campo_travado: Landmark,
  territorio_travado: AlertTriangle,
  operador_sobrecarregado: Users,
  dados_pedindo_revisao: Heart,
};

export function CycleAlertList({
  alerts,
  className,
  title = "Alertas de Ciclo",
}: {
  alerts: OperationalCycleAlert[];
  className?: string;
  title?: string;
}) {
  if (alerts.length === 0) {
    return (
      <Card className={cn("border-2 border-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 rounded-[2px] shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]", className)}>
        <CardContent className="pt-6">
          <p className="text-sm font-black uppercase text-emerald-700">Nenhum ciclo travado agora.</p>
          <p className="text-xs text-emerald-600 mt-1">Siga com o ritmo sustentável e mantenha os fechamentos em dia.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bloco-concreto shadow-none", className)}>
      <CardHeader>
        <CardTitle className="text-xs font-black uppercase tracking-wider text-charcoal">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = iconByAlert[alert.id] || AlertTriangle;
          return (
            <div key={alert.id} className="rounded-[2px] border-2 border-black bg-zinc-50 dark:bg-zinc-800 p-3 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Icon className={alert.severity === "critical" ? "h-4 w-4 text-rust mt-0.5 animate-pulse" : "h-4 w-4 text-burnt-yellow mt-0.5"} />
                  <div>
                    <p className="text-sm font-black text-charcoal dark:text-off-white">{alert.title}</p>
                    <p className="text-xs text-cement dark:text-zinc-300 mt-1">{alert.message}</p>
                    <p className="text-[10px] font-black uppercase text-burnt-yellow dark:text-burnt-yellow mt-1">Próximo passo: {alert.nextStep}</p>
                  </div>
                </div>
                <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="font-mono text-xs">
                  {alert.count}
                </Badge>
              </div>
              <div className="mt-3">
                <Button nativeButton={false} variant="outline" size="xs" className="rounded-[2px]" render={<Link href={alert.href} />}>
                  Resolver Trava <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
