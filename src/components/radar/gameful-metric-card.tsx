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
    card: "radar-outline-card border-[#d8c7ac] bg-[rgba(255,250,242,0.92)] text-zinc-950 shadow-[0_12px_36px_rgba(15,23,42,0.04)]",
    muted: "text-[#796a55]",
    value: "text-zinc-950",
  },
  dark: {
    card: "border-white/10 bg-black/20 text-white shadow-none",
    muted: "text-[#d4c09a]",
    value: "text-white",
  },
  indigo: {
    card: "border-indigo-100 bg-indigo-50/70 text-indigo-950 shadow-none",
    muted: "text-indigo-500",
    value: "text-indigo-950",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/80 text-amber-950 shadow-none",
    muted: "text-amber-600",
    value: "text-amber-950",
  },
  emerald: {
    card: "border-emerald-100 bg-emerald-50/80 text-emerald-950 shadow-none",
    muted: "text-emerald-600",
    value: "text-emerald-950",
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
            {detail && layout === "stack" ? <p className={cn("mt-2 text-sm leading-6", styles.muted)}>{detail}</p> : null}
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
        {detail && layout === "split" ? <p className={cn("text-sm leading-6", styles.muted)}>{detail}</p> : null}
        {helper ? <p className={cn("text-xs leading-5", styles.muted)}>{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
