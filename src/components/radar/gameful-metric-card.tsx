"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GamefulMetricCardProps = {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  detail?: string;
  helper?: string;
  tone?: "light" | "dark" | "indigo" | "amber" | "emerald";
  compact?: boolean;
  className?: string;
};

const toneMap = {
  light: {
    card: "border-zinc-200 bg-white/88 text-zinc-950 shadow-[0_12px_36px_rgba(15,23,42,0.04)]",
    muted: "text-zinc-500",
    value: "text-zinc-950",
  },
  dark: {
    card: "border-white/10 bg-white/5 text-white shadow-none",
    muted: "text-zinc-400",
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
  icon: Icon,
  label,
  value,
  detail,
  helper,
  tone = "light",
  compact = false,
  className,
}: GamefulMetricCardProps) {
  const styles = toneMap[tone];

  return (
    <Card className={cn("py-0", styles.card, className)}>
      <CardContent className={cn("space-y-2", compact ? "p-4" : "p-5")}>
        <div className={cn("flex items-center gap-2", styles.muted)}>
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
        </div>
        <p className={cn("font-black tracking-tight", compact ? "text-xl" : "text-3xl", styles.value)}>{value}</p>
        {detail ? <p className={cn("text-sm leading-6", styles.muted)}>{detail}</p> : null}
        {helper ? <p className={cn("text-xs leading-5", styles.muted)}>{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
