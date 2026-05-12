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
      <Card className={cn("border-emerald-200 bg-emerald-50/50", className)}>
        <CardContent className="pt-6">
          <p className="text-sm font-semibold text-emerald-800">Nenhum ciclo travado agora.</p>
          <p className="text-xs text-emerald-700 mt-1">Siga com o ritmo sustentável e mantenha os fechamentos em dia.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-amber-200 bg-amber-50/40", className)}>
      <CardHeader>
        <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = iconByAlert[alert.id] || AlertTriangle;
          return (
            <div key={alert.id} className="rounded-xl border border-amber-100 bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Icon className={alert.severity === "critical" ? "h-4 w-4 text-rose-600 mt-0.5" : "h-4 w-4 text-amber-700 mt-0.5"} />
                  <div>
                    <p className="text-sm font-black text-zinc-900">{alert.title}</p>
                    <p className="text-sm text-zinc-700">{alert.message}</p>
                    <p className="text-xs text-zinc-600 mt-1">Próximo passo: {alert.nextStep}</p>
                  </div>
                </div>
                <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="font-black">
                  {alert.count}
                </Badge>
              </div>
              <div className="mt-3">
                <Button nativeButton={false} variant="outline" size="sm" className="font-bold">
                  <Link href={alert.href} className="flex items-center">
                    Ir para ação <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
