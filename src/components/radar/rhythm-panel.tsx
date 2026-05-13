"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";

type RhythmMetric = {
  label: string;
  value: string | number;
  helper: string;
};

type RhythmSignal = {
  label: string;
  value: string | number;
};

type RhythmPanelProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  metrics: RhythmMetric[];
  signals?: RhythmSignal[];
  footer?: ReactNode;
  className?: string;
};

export function RhythmPanel({
  icon: Icon,
  eyebrow,
  title,
  description,
  badge,
  metrics,
  signals = [],
  footer,
  className,
}: RhythmPanelProps) {
  return (
    <Card className={cn("overflow-hidden border-zinc-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.85),_transparent_40%),linear-gradient(145deg,#09090b_0%,#18181b_58%,#27272a_100%)] py-0 text-white shadow-[0_24px_72px_rgba(15,23,42,0.18)]", className)}>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">{eyebrow}</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-white">{title}</h3>
            </div>
          </div>
          <p className="text-sm leading-6 text-zinc-300">{description}</p>
          {badge ? (
            <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              {badge}
            </div>
          ) : null}
          {footer ? <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">{footer}</div> : null}
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <GamefulMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                helper={metric.helper}
                tone="dark"
                compact
              />
            ))}
          </div>
          {signals.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {signals.map((signal) => (
                <GamefulMetricCard
                  key={signal.label}
                  label={signal.label}
                  value={signal.value}
                  tone="dark"
                  compact
                />
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
