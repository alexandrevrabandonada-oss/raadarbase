import { Info, ShieldAlert, Clock, Milestone, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type RiskFlags = {
  doNotContact?: boolean;
  recentOutreach?: boolean;
  noReferralAfterResponse?: boolean;
};

interface PersonScoreBadgeProps {
  score: number;
  temperature: string;
  tooltipText?: string;
  riskFlags?: RiskFlags;
  className?: string;
}

export function PersonScoreBadge({ score, temperature, tooltipText, riskFlags, className }: PersonScoreBadgeProps) {
  const getBadgeStyle = () => {
    switch (temperature) {
      case "quente":
      case "muito_quente":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "morno":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "frio":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const hasRisk = riskFlags?.doNotContact || riskFlags?.recentOutreach || riskFlags?.noReferralAfterResponse;

  const BadgeContent = (
    <div className={cn("flex flex-col items-end", tooltipText ? "cursor-help hover:opacity-80 transition-opacity" : "", className)}>
      <Badge variant="outline" className={cn("text-[10px] uppercase tracking-tight", getBadgeStyle())}>
        Score {score}
      </Badge>
    </div>
  );

  if (!tooltipText && !hasRisk) {
    return BadgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {BadgeContent}
        </TooltipTrigger>
        <TooltipContent className="w-80 p-4 shadow-xl" align="end" sideOffset={8}>
          <div className="space-y-4">
            {tooltipText && (
              <div className="space-y-1">
                <h4 className="font-black text-sm text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-600" />
                  Por que este score?
                </h4>
                <p className="text-xs text-muted-foreground">{tooltipText}</p>
              </div>
            )}
            
            {(hasRisk || tooltipText) && (
              <div className={cn("space-y-2", tooltipText ? "pt-3 border-t border-zinc-100" : "")}>
                <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Alertas de Risco</h5>
                <div className="flex flex-col gap-1.5">
                  {riskFlags?.doNotContact ? (
                    <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <strong>Bloqueado:</strong> A pessoa pediu para não ser abordada.
                    </div>
                  ) : null}
                  {riskFlags?.recentOutreach ? (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                      <Clock className="h-4 w-4 shrink-0" />
                      <strong>Contato Recente:</strong> Aguarde antes de insistir.
                    </div>
                  ) : null}
                  {riskFlags?.noReferralAfterResponse ? (
                    <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100">
                      <Milestone className="h-4 w-4 shrink-0" />
                      <strong>A Encaminhar:</strong> A pessoa respondeu e precisa de direcionamento.
                    </div>
                  ) : null}
                  {!hasRisk ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Caminho livre para contato.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
