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
      <Card className={cn("bloco-concreto h-full relative overflow-hidden py-0 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", className)}>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("rounded-[2px] border-2 border-black font-black uppercase text-[10px]", completed ? "bg-moss/10 text-moss" : "bg-charcoal/10 text-charcoal")}>
                  {phaseLabel}
                </Badge>
                {neighborhood ? (
                  <Badge variant="outline" className="rounded-[2px] border-2 border-black bg-white text-charcoal font-black uppercase text-[10px]">
                    <MapPin className="mr-1 h-3 w-3 text-cement" /> {neighborhood}
                  </Badge>
                ) : null}
              </div>
              <h4 className="mt-3 text-xl font-black tracking-tight text-charcoal">{title}</h4>
              <p className="mt-1 text-xs font-semibold text-cement">{dateLabel}</p>
            </div>
            {progress}
          </div>

          <div className={cn("grid gap-3", metrics.length >= 4 ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-3")}>
            {metrics.map((metric) => (
              <GamefulMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                tone="light"
                compact
                className="border-2 border-black/10 shadow-none bg-charcoal/5 rounded-[2px]"
              />
            ))}
          </div>

          <div className={cn("rounded-[2px] border-2 border-black p-4", completed ? "bg-moss/5 text-moss" : "bg-charcoal/5 text-charcoal")}>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", completed ? "text-moss" : "text-cement")}>
              {completed ? "Fechamento do ciclo" : "Próximo passo da missão"}
            </p>
            <p className={cn("mt-2 text-sm font-black", completed ? "text-moss" : "text-charcoal")}>{nextStep}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
