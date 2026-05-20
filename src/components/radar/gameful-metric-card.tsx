"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GamefulMetricCardProps = {
  icon?: ReactNode;
  label: string;
  value: string | number;
  detail?: string;
  helper?: string;
  tone?: "light" | "dark" | "indigo" | "amber" | "emerald";
  compact?: boolean;
  layout?: "stack" | "split";
  title?: string;
  valueClassName?: string;
  className?: string;
};

const toneMap = {
  light: {
    card: "bloco-concreto relative overflow-hidden py-0 bg-white text-charcoal shadow-sm",
    muted: "text-cement font-semibold",
    value: "text-charcoal",
  },
  dark: {
    card: "border-2 border-white/20 bg-charcoal text-white shadow-none rounded-[2px]",
    muted: "text-cement font-semibold",
    value: "text-white",
  },
  indigo: {
    card: "border-2 border-black bg-burnt-yellow/10 text-charcoal shadow-none rounded-[2px]",
    muted: "text-cement font-semibold",
    value: "text-charcoal",
  },
  amber: {
    card: "border-2 border-rust bg-rust/5 text-rust shadow-none rounded-[2px]",
    muted: "text-rust font-semibold",
    value: "text-rust",
  },
  emerald: {
    card: "border-2 border-moss bg-moss/5 text-moss shadow-none rounded-[2px]",
    muted: "text-moss font-semibold",
    value: "text-moss",
  },
} as const;

export function GamefulMetricCard({
  icon,
  label,
  value,
  detail,
  helper,
  tone = "light",
  compact = false,
  layout = "stack",
  title,
  valueClassName,
  className,
}: GamefulMetricCardProps) {
  const styles = toneMap[tone];

  return (
    <Card className={cn("py-0", styles.card, className)} title={title}>
      <CardContent className={cn(compact ? "p-4" : "p-5", layout === "split" ? "space-y-3" : "space-y-2")}>
        <div className={cn("flex gap-2", styles.muted, layout === "split" ? "items-start justify-between" : "items-center")}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon ? <span className="shrink-0">{icon}</span> : null}
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
            </div>
            {detail && layout === "stack" ? <p className={cn("mt-2 text-xs leading-5", styles.muted)}>{detail}</p> : null}
          </div>
          <p
            className={cn(
              "min-w-0 font-black tracking-tight",
              compact ? "text-xl" : "text-3xl",
              layout === "split" && "max-w-[10ch] text-right text-lg sm:text-xl",
              styles.value,
              valueClassName,
            )}
          >
            {value}
          </p>
        </div>
        {detail && layout === "split" ? <p className={cn("text-xs leading-5", styles.muted)}>{detail}</p> : null}
        {helper ? <p className={cn("text-xs leading-5", styles.muted)}>{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
