import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { FieldJourneySnapshot } from "@/lib/data/field-agenda-journey";
import { AlertTriangle, CheckCircle2, ListChecks, Sparkles } from "lucide-react";

function getPhaseTone(currentPhase: FieldJourneySnapshot["currentPhase"]) {
  if (currentPhase === "follow_up") {
    return "text-moss border-2 border-black bg-moss/10";
  }
  if (currentPhase === "realizar" || currentPhase === "registrar") {
    return "text-charcoal border-2 border-black bg-burnt-yellow/10";
  }
  return "text-cement border-2 border-black bg-white";
}

export function FieldJourneyProgressCompact({ snapshot }: { snapshot: FieldJourneySnapshot }) {
  return (
    <div className="space-y-2 min-w-[190px]">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest rounded-[2px]", getPhaseTone(snapshot.currentPhase))}>
          {snapshot.currentPhaseLabel}
        </Badge>
        <span className="text-[10px] font-black text-cement uppercase tracking-widest">{snapshot.progressPercent}%</span>
      </div>
      <Progress value={snapshot.progressPercent} className="h-2 border-2 border-black rounded-[2px] bg-charcoal/10" />
      <p className="text-[10px] font-bold text-cement leading-tight">{snapshot.nextStep}</p>
    </div>
  );
}

export function FieldJourneyPanel({ snapshot }: { snapshot: FieldJourneySnapshot }) {
  return (
    <Card className="bloco-concreto relative overflow-hidden py-0 bg-white">
      <CardHeader className="pb-3 border-b-2 border-black">
        <CardTitle className="text-base font-black uppercase flex items-center gap-2 text-charcoal">
          <Sparkles className="h-4 w-4 text-cement" />
          Jornada da Ação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className={cn("font-black uppercase text-[10px] tracking-widest rounded-[2px]", getPhaseTone(snapshot.currentPhase))}>
              Fase: {snapshot.currentPhaseLabel}
            </Badge>
            <span className="text-xs font-black text-charcoal">{snapshot.progressPercent}%</span>
          </div>
          <Progress value={snapshot.progressPercent} className="h-3 border-2 border-black rounded-[2px] bg-charcoal/10" />
          <p className="text-xs font-bold text-charcoal">{snapshot.nextStep}</p>
        </div>

        <div className="space-y-2 pt-3 border-t border-cement/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-cement">Checklist da fase</p>
          <div className="space-y-2">
            {snapshot.checklist.map((item) => (
              <div key={item.label} className="flex items-start gap-2 text-xs font-semibold">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-moss flex-shrink-0" />
                ) : (
                  <ListChecks className="h-4 w-4 mt-0.5 text-cement flex-shrink-0" />
                )}
                <span className={item.done ? "text-charcoal font-bold" : "text-cement"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-cement/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-cement">Bloqueios</p>
          {snapshot.blockers.length === 0 ? (
            <p className="text-xs text-moss font-bold">Sem bloqueios críticos para esta fase.</p>
          ) : (
            <div className="space-y-1.5">
              {snapshot.blockers.map((blocker) => (
                <div key={blocker} className="flex items-start gap-2 text-xs text-rust font-bold">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-rust flex-shrink-0" />
                  <span>{blocker}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-3 border-t border-cement/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-cement">Ações recomendadas</p>
          <ul className="space-y-1.5">
            {snapshot.recommendedActions.map((action) => (
              <li key={action} className="text-xs font-semibold text-charcoal">
                • {action}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
