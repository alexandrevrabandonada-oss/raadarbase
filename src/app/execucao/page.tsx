import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { getExecutionStats } from "@/lib/data/action-execution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertTriangle,
  ArrowRight,
  AlertCircle,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ExecucaoPage() {
  await requireInternalPageSession("/execucao");
  const stats = await getExecutionStats();

  return (
    <AppShell>
      <PageHeader
        title="Execução Operacional"
        description="Monitoramento de tarefas, evidências e resultados das ações em campo."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-black">{stats.activeActions}</div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Tarefas Ativas</div>
              </div>
              <Play className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-black text-green-700">{stats.completedTasks}</div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Concluídas</div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-black text-blue-700">{stats.tasksWithEvidence}</div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Com Evidência</div>
              </div>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.overdueTasks > 0 ? "bg-red-50 border-red-200" : "bg-amber-50"}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className={`text-2xl font-black ${stats.overdueTasks > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  {stats.overdueTasks}
                </div>
                <div className="text-xs text-muted-foreground uppercase font-bold">Vencidas</div>
              </div>
              <Clock className={`h-5 w-5 ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Alertas de Execução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.overdueTasks > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-800">Tarefas Vencidas</h4>
                  <p className="text-xs text-red-700 mt-1">
                    Existem {stats.overdueTasks} tarefas que ultrapassaram o prazo estimado sem serem concluídas.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-red-800 font-bold mt-2"
                    nativeButton={false}
                    render={<Link href="/acoes?filter=vencidas" />}
                  >
                    Ver tarefas <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {stats.completedWithoutResult > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Concluídas sem Resultado</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Existem {stats.completedWithoutResult} tarefas marcadas como &quot;Feito&quot; mas que não possuem registro de resultado ou aprendizado.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-amber-800 font-bold mt-2"
                    nativeButton={false}
                    render={<Link href="/acoes?filter=sem-resultado" />}
                  >
                    Regularizar agora <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-800">Aprendizados Estratégicos</h4>
                  <p className="text-xs text-indigo-700 mt-1">
                    Transforme as lições aprendidas em campo em memória organizacional.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-white"
                  nativeButton={false}
                  render={<Link href="/memoria/sugestoes" />}
                >
                  Sugerir Memórias
                </Button>
                <Button size="sm" className="flex-1" nativeButton={false} render={<Link href="/memoria/nova" />}>
                  Nova Memória
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm italic">
              Selecione um plano para ver os próximos passos detalhados.
            </div>
            <Button className="w-full" nativeButton={false} render={<Link href="/acoes" />}>
              Ir para Planos de Ação
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
