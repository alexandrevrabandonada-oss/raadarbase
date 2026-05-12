import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { FieldJourneySnapshot } from "@/lib/data/field-agenda-journey";
import { AlertTriangle, CheckCircle2, ListChecks, Sparkles } from "lucide-react";

function getPhaseTone(currentPhase: FieldJourneySnapshot["currentPhase"]) {
  if (currentPhase === "follow_up") {
    return "text-emerald-700 border-emerald-200 bg-emerald-50";
  }
  if (currentPhase === "realizar" || currentPhase === "registrar") {
    return "text-indigo-700 border-indigo-200 bg-indigo-50";
  }
  return "text-zinc-700 border-zinc-200 bg-zinc-50";
}

export function FieldJourneyProgressCompact({ snapshot }: { snapshot: FieldJourneySnapshot }) {
  return (
    <div className="space-y-2 min-w-[190px]">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest", getPhaseTone(snapshot.currentPhase))}>
          {snapshot.currentPhaseLabel}
        </Badge>
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{snapshot.progressPercent}%</span>
      </div>
      <Progress value={snapshot.progressPercent} className="h-1.5" />
      <p className="text-[10px] font-bold text-zinc-500 leading-tight">{snapshot.nextStep}</p>
    </div>
  );
}

export function FieldJourneyPanel({ snapshot }: { snapshot: FieldJourneySnapshot }) {
  return (
    <Card className="border-indigo-100 bg-indigo-50/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          Jornada da Ação de Campo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className={cn("font-black uppercase text-[10px] tracking-widest", getPhaseTone(snapshot.currentPhase))}>
              Fase atual: {snapshot.currentPhaseLabel}
            </Badge>
            <span className="text-xs font-black text-zinc-500">{snapshot.progressPercent}%</span>
          </div>
          <Progress value={snapshot.progressPercent} className="h-2" />
          <p className="text-xs font-bold text-zinc-700">{snapshot.nextStep}</p>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Checklist da fase</p>
          <div className="space-y-2">
            {snapshot.checklist.map((item) => (
              <div key={item.label} className="flex items-start gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <ListChecks className="h-4 w-4 mt-0.5 text-zinc-400 flex-shrink-0" />
                )}
                <span className={item.done ? "text-zinc-800 font-medium" : "text-zinc-500"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bloqueios</p>
          {snapshot.blockers.length === 0 ? (
            <p className="text-sm text-emerald-700 font-medium">Sem bloqueios críticos para esta fase.</p>
          ) : (
            <div className="space-y-1.5">
              {snapshot.blockers.map((blocker) => (
                <div key={blocker} className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                  <span>{blocker}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ações recomendadas</p>
          <ul className="space-y-1.5">
            {snapshot.recommendedActions.map((action) => (
              <li key={action} className="text-sm text-zinc-700">
                - {action}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
