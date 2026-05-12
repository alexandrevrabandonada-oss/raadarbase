import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TeamFlowAdoptionMetrics } from "@/lib/data/team-flow-adoption";

export function TeamFlowAdoptionPanel({ data }: { data: TeamFlowAdoptionMetrics }) {
  const indicators = [
    { label: "Operadores ativos no dia", value: data.indicators.activeOperatorsToday },
    { label: "Operadores que abriram Minha Fila", value: data.indicators.operatorsOpenedQueue },
    { label: "Tarefas assumidas", value: data.indicators.tasksAssumed },
    { label: "DMs preparadas", value: data.indicators.dmsPrepared },
    { label: "DMs confirmadas", value: data.indicators.dmsConfirmed },
    { label: "Respostas registradas", value: data.indicators.responsesRecorded },
    { label: "Encaminhamentos feitos", value: data.indicators.referralsMade },
    { label: "Fechamentos diários gerados", value: data.indicators.dailyClosuresGenerated },
    { label: "Feedbacks enviados", value: data.indicators.feedbacksSent },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-600">
          Adoção do Fluxo da Equipe
        </CardTitle>
        <p className="text-sm text-zinc-600 font-medium">Onde a equipe está travando?</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {indicators.map((item) => (
            <div key={item.label} className="rounded-xl border border-zinc-100 bg-zinc-50/40 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</p>
              <p className="text-2xl font-black text-zinc-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Gargalo: DM copiada vs envio confirmado</p>
            <p className="text-3xl font-black text-amber-900">{data.bottlenecks.dmCopyToConfirmGap}</p>
            <p className="text-xs text-amber-800 mt-1">Diferença entre preparo e confirmação de DM no dia.</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Gargalo: resposta vs encaminhamento</p>
            <p className="text-3xl font-black text-amber-900">{data.bottlenecks.responseToReferralGap}</p>
            <p className="text-xs text-amber-800 mt-1">Respostas registradas que ainda aguardam próximo encaminhamento.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-100 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Tarefas paradas por etapa</p>
            <div className="space-y-2">
              {data.stalledByStage.map((item) => (
                <div key={item.stage} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <span className="text-sm font-bold text-zinc-700">{item.stage}</span>
                  <Badge variant="secondary" className="font-black">{item.count}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Uso da Ficha Rápida</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aberturas</p>
                <p className="text-2xl font-black text-zinc-900">{data.quickSheetUsage.opens}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Operadores usando</p>
                <p className="text-2xl font-black text-zinc-900">{data.quickSheetUsage.operators}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
