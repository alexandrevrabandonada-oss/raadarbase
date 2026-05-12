"use client";

import * as React from "react";
import { 
  CheckCircle2, 
  FileText, 
  Copy, 
  Download, 
  AlertTriangle, 
  MessageSquare, 
  Users, 
  ArrowRightCircle,
  Zap,
  Calendar,
  ChevronRight,
  History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { trackOperationalEvent } from "@/app/actions";

interface DailyClosureProps {
  stats: {
    workedToday: number;
    dmsSent: number;
    responsesRecorded: number;
    referralsCreated: number;
    doNotContact: number;
    unassigned: number;
    pendingReferrals: number;
    stale: number;
    waiting3DaysCount: number;
    waiting7DaysCount: number;
    archivedWithoutReturnCount: number;
  };
}

export function DailyClosure({ stats }: DailyClosureProps) {
  const { toast } = useToast();
  const [summary, setSummary] = React.useState<string | null>(null);

  const generateSummary = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    const content = `# Fechamento Diário Radar de Base - ${date}

## 📊 Resumo Numérico
- **Tarefas Trabalhadas:** ${stats.workedToday}
- **DMs Enviadas:** ${stats.dmsSent}
- **Respostas Registradas:** ${stats.responsesRecorded}
- **Novos Encaminhamentos:** ${stats.referralsCreated}
- **Restrições (Não Abordar):** ${stats.doNotContact}

## ⚠️ Alertas e Pendências
- **Tarefas Órfãs (Sem Responsável):** ${stats.unassigned}
- **Aguardando Encaminhamento:** ${stats.pendingReferrals}
- **Tarefas Paradas (+48h):** ${stats.stale}
- **Aguardando Retorno (3+ dias):** ${stats.waiting3DaysCount}
- **Aguardando Retorno (7+ dias):** ${stats.waiting7DaysCount}
- **Arquivadas sem Retorno:** ${stats.archivedWithoutReturnCount}

## 🚀 Próximos Passos
- Priorizar a distribuição das ${stats.unassigned} tarefas órfãs.
- Resolver os ${stats.pendingReferrals} encaminhamentos pendentes para não esfriar o contato.
- Revisar as ${stats.waiting3DaysCount} pessoas aguardando há mais de 3 dias.
- Considerar arquivamento para as ${stats.waiting7DaysCount} pessoas paradas há mais de uma semana.

---
*Relatório gerado automaticamente pelo Radar de Base.*
*Foco: Qualidade do fluxo e mobilização ética.*
`;
    setSummary(content);
    trackOperationalEvent("daily_closure_generated");
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast({ title: "Copiado", description: "Resumo em Markdown copiado para o clipboard." });
    }
  };

  const handleDownload = () => {
    if (summary) {
      const blob = new Blob([summary], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fechamento-radar-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-4 pt-6 space-y-1">
            <p className="text-[10px] font-black uppercase text-emerald-700/60 tracking-widest">Produção Hoje</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-emerald-950">{stats.workedToday}</p>
              <Zap className="h-5 w-5 text-emerald-500 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-emerald-700">Tarefas movimentadas</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardContent className="p-4 pt-6 space-y-1">
            <p className="text-[10px] font-black uppercase text-indigo-700/60 tracking-widest">DMs Enviadas</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-indigo-950">{stats.dmsSent}</p>
              <ArrowRightCircle className="h-5 w-5 text-indigo-500 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-indigo-700">Abordagens iniciais</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/30">
          <CardContent className="p-4 pt-6 space-y-1">
            <p className="text-[10px] font-black uppercase text-amber-700/60 tracking-widest">Respostas</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-amber-950">{stats.responsesRecorded}</p>
              <MessageSquare className="h-5 w-5 text-amber-500 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-amber-700">Feedbacks registrados</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/30">
          <CardContent className="p-4 pt-6 space-y-1">
            <p className="text-[10px] font-black uppercase text-rose-700/60 tracking-widest">Pendências</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-rose-950">{stats.unassigned + stats.pendingReferrals}</p>
              <AlertTriangle className="h-5 w-5 text-rose-500 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-rose-700">Precisam de ação agora</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-zinc-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Balanço Operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Encaminhamentos Criados", value: stats.referralsCreated, icon: ArrowRightCircle, color: "text-emerald-600" },
                { label: "Não Abordar Respeitados", value: stats.doNotContact, icon: CheckCircle2, color: "text-indigo-600" },
                { label: "Tarefas Órfãs", value: stats.unassigned, icon: Users, color: "text-rose-600" },
                { label: "Respostas Travadas", value: stats.pendingReferrals, icon: MessageSquare, color: "text-amber-600" },
                { label: "Tarefas Paradas (+48h)", value: stats.stale, icon: AlertTriangle, color: "text-rose-600" },
                { label: "Aguardando 3+ Dias", value: stats.waiting3DaysCount, icon: History, color: "text-amber-600" },
                { label: "Aguardando 7+ Dias", value: stats.waiting7DaysCount, icon: AlertTriangle, color: "text-rose-600" },
                { label: "Arquivadas Sem Retorno", value: stats.archivedWithoutReturnCount, icon: CheckCircle2, color: "text-zinc-600" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                    <span className="text-xs font-bold text-zinc-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-zinc-900">{item.value}</span>
                </div>
              ))}
              
              <Button 
                onClick={generateSummary} 
                className="w-full mt-4 bg-black text-white font-black"
              >
                Gerar Resumo do Dia
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          {summary ? (
            <Card className="h-full border-indigo-100 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-indigo-50">
                <CardTitle className="text-sm font-black text-indigo-950">Resumo Gerado (Markdown)</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 text-indigo-600 font-bold">
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copiar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 text-indigo-600 font-bold">
                    <Download className="h-3.5 w-3.5 mr-2" /> Baixar .md
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <pre className="text-xs font-mono bg-zinc-50 p-4 rounded-xl border border-zinc-100 overflow-x-auto whitespace-pre-wrap leading-relaxed text-zinc-700">
                  {summary}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
              <FileText className="h-10 w-10 text-zinc-200 mb-3" />
              <p className="text-sm font-black text-zinc-400">Clique em &quot;Gerar Resumo do Dia&quot; para visualizar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
