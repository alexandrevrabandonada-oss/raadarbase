"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GamefulHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  aside?: ReactNode;
  variant?: "light" | "dark" | "territory" | "field";
  metricsClassName?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  compact?: boolean;
};

const heroStyles = {
  light: "radar-paper border-[#d9c8ae] text-zinc-950",
  dark: "radar-panel-dark border-[#23313b] text-white",
  territory: "radar-panel-dark border-[#23313b] text-white",
  field: "radar-panel-dark border-[#23313b] text-white",
} as const;

export function GamefulHero({
  eyebrow,
  title,
  description,
  icon,
  badges,
  actions,
  metrics,
  aside,
  variant = "light",
  metricsClassName,
  className,
  titleClassName,
  descriptionClassName,
  compact = false,
}: GamefulHeroProps) {
  const isLight = variant === "light";

  return (
    <section className={cn("radar-outline-card relative overflow-hidden rounded-[28px] border shadow-[0_24px_80px_rgba(15,23,42,0.08)]", compact ? "p-4 sm:p-5 xl:p-5 2xl:p-6" : "p-5 sm:p-6 2xl:p-8", heroStyles[variant], className)}>
      <div className={cn("pointer-events-none absolute inset-0 opacity-40", isLight ? "radar-grid" : "bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]")} />
      <div className={cn("relative grid", compact ? "gap-4 xl:gap-5" : "gap-6 2xl:gap-8", aside ? "2xl:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)]" : "")}>
        <div className={cn("min-w-0", compact ? "space-y-4" : "space-y-5 2xl:space-y-6")}>
          <div className={cn("flex flex-col", compact ? "gap-3" : "gap-4 2xl:gap-5")}>
            {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
            <div className={cn("max-w-3xl", compact ? "space-y-2" : "space-y-3")}>
              <div className="flex items-start gap-3">
                {icon ? (
                  <div className={cn("rounded-2xl border p-3", isLight ? "border-zinc-200 bg-white/80" : "border-white/10 bg-white/10")}>
                    {icon}
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", isLight ? "text-[#7d6f59]" : "text-[#d4b678]")}>{eyebrow}</p>
                  <h1 className={cn(compact ? "mt-1 text-3xl font-black tracking-tight sm:text-[2.2rem] xl:text-[2.6rem]" : "mt-1 text-3xl font-black tracking-tight sm:text-4xl xl:text-[3.25rem]", isLight ? "text-zinc-950" : "text-white", titleClassName)}>{title}</h1>
                </div>
              </div>
              <p className={cn(compact ? "max-w-3xl text-sm leading-6 sm:text-[0.95rem]" : "max-w-3xl text-sm leading-6 sm:text-base xl:text-[1.05rem] xl:leading-7", isLight ? "text-zinc-700" : "font-medium text-zinc-300", descriptionClassName)}>{description}</p>
            </div>
            {actions ? <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">{actions}</div> : null}
          </div>
          {metrics ? <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", compact && "gap-2.5", metricsClassName)}>{metrics}</div> : null}
        </div>
        {aside ? <div className="relative min-w-0">{aside}</div> : null}
      </div>
    </section>
  );
}

export function GamefulHeroBadge({
  children,
  light = false,
  className,
}: {
  children: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] shadow-none",
        light ? "border border-[#d3b98f] bg-[rgba(255,250,242,0.88)] text-[#6f6250]" : "border border-white/10 bg-white/10 text-white",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
