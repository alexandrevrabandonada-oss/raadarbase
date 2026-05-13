"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GamefulMetricCard } from "@/components/radar/gameful-metric-card";
import { cn } from "@/lib/utils";

type FieldMissionMetric = {
  label: string;
  value: string | number;
};

type FieldMissionCardProps = {
  title: string;
  neighborhood?: string | null;
  phaseLabel: string;
  dateLabel: string;
  nextStep: string;
  href: string;
  progress?: ReactNode;
  metrics: FieldMissionMetric[];
  completed?: boolean;
  className?: string;
};

export function FieldMissionCard({
  title,
  neighborhood,
  phaseLabel,
  dateLabel,
  nextStep,
  href,
  progress,
  metrics,
  completed = false,
  className,
}: FieldMissionCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className={cn("h-full rounded-[30px] border-zinc-200 bg-white py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl", className)}>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn(completed ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-50")}>
                  {phaseLabel}
                </Badge>
                {neighborhood ? (
                  <Badge variant="outline" className="border-zinc-200 text-zinc-600">
                    <MapPin className="mr-1 h-3 w-3" /> {neighborhood}
                  </Badge>
                ) : null}
              </div>
              <h4 className="mt-3 text-xl font-black tracking-tight text-zinc-950">{title}</h4>
              <p className="mt-1 text-sm font-medium text-zinc-500">{dateLabel}</p>
            </div>
            {progress}
          </div>

          <div className={cn("grid gap-3", metrics.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-3")}>
            {metrics.map((metric) => (
              <GamefulMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                tone="light"
                compact
                className="border-zinc-100 bg-zinc-50 shadow-none"
              />
            ))}
          </div>

          <div className={cn("rounded-2xl p-4", completed ? "border border-emerald-100 bg-emerald-50/60" : "border border-indigo-100 bg-indigo-50/60")}>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", completed ? "text-emerald-600" : "text-indigo-500")}>
              {completed ? "Fechamento do ciclo" : "Próximo passo da missão"}
            </p>
            <p className={cn("mt-2 text-sm font-black", completed ? "text-emerald-950" : "text-indigo-950")}>{nextStep}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
