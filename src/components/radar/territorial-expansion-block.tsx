"use client";

import * as React from "react";
import { 
  MapPin,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TerritorialExpansionCandidate, TerritorialExpansionResult, ExpansionReadinessChecklistItem } from "@/lib/data/territorial-expansion";

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  observacao: { label: "Observação", color: "bg-zinc-100 text-zinc-600" },
  escuta: { label: "Escuta", color: "bg-sky-100 text-sky-600" },
  mobilizacao: { label: "Mobilização", color: "bg-amber-100 text-amber-600" },
  campo: { label: "Campo", color: "bg-indigo-100 text-indigo-600" },
  continuidade: { label: "Continuidade", color: "bg-emerald-100 text-emerald-600" },
};

const READINESS_LEVEL = (score: number) => {
  if (score >= 75) return { level: "Pronto", color: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700" };
  if (score >= 50) return { level: "Preparação", color: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700" };
  return { level: "Risco", color: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700" };
};

interface TerritorialExpansionBlockProps {
  expansionData: TerritorialExpansionResult;
}

function ChecklistItemView({ item, compact = false }: { item: ExpansionReadinessChecklistItem; compact?: boolean }) {
  const Icon = item.status === "met" ? CheckCircle2 : item.status === "partial" ? AlertCircle : Circle;
  const color = item.status === "met" ? "text-emerald-500" : item.status === "partial" ? "text-amber-500" : "text-zinc-300";

  return (
    <div className="flex items-start gap-2">
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-xs uppercase tracking-tight", 
          item.status === "met" ? "text-zinc-900" : item.status === "partial" ? "text-amber-900" : "text-zinc-400"
        )}>
          {item.label}
        </p>
        {!compact && item.evidence && (
          <p className="text-xs text-zinc-500 font-medium mt-0.5">{item.evidence}</p>
        )}
      </div>
    </div>
  );
}

function CandidateCard({ candidate, expanded = false }: { candidate: TerritorialExpansionCandidate; expanded?: boolean }) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);
  const readinessLevel = READINESS_LEVEL(candidate.readinessScore);
  const phaseInfo = PHASE_LABELS[candidate.phaseId as keyof typeof PHASE_LABELS] || { label: "Desconhecido", color: "bg-zinc-100" };

  const metCount = candidate.checklist.filter(c => c.status === "met").length;

  return (
    <Card className={cn(
      "border transition-all",
      readinessLevel.color
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              <CardTitle className="text-lg font-black uppercase text-zinc-900 truncate">
                {candidate.neighborhood}
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={phaseInfo.color}>{phaseInfo.label}</Badge>
              <Badge className={readinessLevel.badge}>{readinessLevel.level}</Badge>
              {candidate.hasPlannedEvent && (
                <Badge className="bg-sky-100 text-sky-700">Evento agendado</Badge>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-black text-zinc-900">{candidate.readinessScore}</div>
            <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">score</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-white/40 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-black text-zinc-900">{candidate.peopleMonitored}</div>
            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">Pessoas</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-black text-zinc-900">{candidate.daysSinceAction === Number.MAX_SAFE_INTEGER ? "—" : candidate.daysSinceAction}d</div>
            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">Sem ação</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-black text-zinc-900">{candidate.volunteers}</div>
            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">Voluntários</div>
          </div>
        </div>

        {/* Checklist Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-xs uppercase text-zinc-600 tracking-tight">Critérios de Abertura</h4>
            <span className="text-xs font-bold text-emerald-600">{metCount}/{candidate.checklist.length}</span>
          </div>
          <div className="space-y-2">
            {isExpanded ? (
              candidate.checklist.map((item) => (
                <ChecklistItemView key={item.id} item={item} compact={false} />
              ))
            ) : (
              candidate.checklist.slice(0, 3).map((item) => (
                <ChecklistItemView key={item.id} item={item} compact={true} />
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold h-8"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Menos detalhes
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Mais detalhes
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold h-8"
            >
              Preparar
            </Button>
            {candidate.readinessScore >= 75 && (
              <Button
                size="sm"
                className="text-xs font-bold h-8 bg-emerald-600 hover:bg-emerald-700"
              >
                Abrir
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TerritorialExpansionBlock({ expansionData }: TerritorialExpansionBlockProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-600 p-2 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 sm:text-2xl">
              Próximos Territórios para Abrir
            </h2>
            <p className="text-sm text-zinc-500 font-medium">
              Análise de prontidão para escala territorial controlada
            </p>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-zinc-100">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-black text-zinc-900">{expansionData.metrics.totalCandidates}</div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-tight mt-1">Candidatos</div>
            </CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-black text-emerald-600">{expansionData.metrics.readyCount}</div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-tight mt-1">Prontos</div>
            </CardContent>
          </Card>
          <Card className="border-amber-100 bg-amber-50/50">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-black text-amber-600">{expansionData.metrics.needsPrepCount}</div>
              <div className="text-xs font-bold text-amber-600 uppercase tracking-tight mt-1">Em Prep.</div>
            </CardContent>
          </Card>
          <Card className="border-red-100 bg-red-50/50">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-black text-red-600">{expansionData.metrics.atRiskCount}</div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-tight mt-1">Em Risco</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabbed View */}
      <Tabs defaultValue="ready" className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start gap-3 border-b border-zinc-100 bg-transparent p-0 pb-2">
          <TabsTrigger
            value="ready"
            className="rounded-none px-0 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 transition-all data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Prontos para Abrir
            {expansionData.metrics.readyCount > 0 && (
              <Badge className="ml-2 bg-emerald-100 text-emerald-700">{expansionData.metrics.readyCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="prep"
            className="rounded-none px-0 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 transition-all data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Precisam Preparação
            {expansionData.metrics.needsPrepCount > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">{expansionData.metrics.needsPrepCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="risk"
            className="rounded-none px-0 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 transition-all data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Em Risco
            {expansionData.metrics.atRiskCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-700">{expansionData.metrics.atRiskCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Ready Tab */}
        <TabsContent value="ready" className="mt-0 space-y-4">
          {expansionData.grouped.readyToOpen.length === 0 ? (
            <Card className="border-dashed border-zinc-200">
              <CardContent className="pt-12 pb-12 text-center">
                <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-medium">Nenhum território pronto para abrir no momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {expansionData.grouped.readyToOpen.map((candidate) => (
                <CandidateCard key={candidate.neighborhood} candidate={candidate} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Prep Tab */}
        <TabsContent value="prep" className="mt-0 space-y-4">
          {expansionData.grouped.needsPrep.length === 0 ? (
            <Card className="border-dashed border-zinc-200">
              <CardContent className="pt-12 pb-12 text-center">
                <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-medium">Nenhum território em fase de preparação.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {expansionData.grouped.needsPrep.map((candidate) => (
                <CandidateCard key={candidate.neighborhood} candidate={candidate} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="mt-0 space-y-4">
          {expansionData.grouped.atRisk.length === 0 ? (
            <Card className="border-dashed border-zinc-200">
              <CardContent className="pt-12 pb-12 text-center">
                <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-medium">Nenhum território em situação de risco.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {expansionData.grouped.atRisk.map((candidate) => (
                <CandidateCard key={candidate.neighborhood} candidate={candidate} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Guidance Section */}
      <Card className="border-indigo-200 bg-indigo-50/50">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-indigo-900 uppercase tracking-tight">
            Orientação para Abertura de Territórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-zinc-900">Prontos (≥75 pts)</p>
              <p className="text-zinc-600">Podem ser abertos imediatamente com os preparativos operacionais finais.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-zinc-900">Preparação (50-75 pts)</p>
              <p className="text-zinc-600">Precisam de investimento operacional: operador, evento agendado, ou consolidação de sinais.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-zinc-900">Risco (&lt;50 pts)</p>
              <p className="text-zinc-600">Abrir sem reduzir risco resultaria em ineficiência. Esperar ou investir em sinais.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
