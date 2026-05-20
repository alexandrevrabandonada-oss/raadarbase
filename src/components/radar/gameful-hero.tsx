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
  light: "radar-paper border-[#0B0B0B] text-charcoal",
  dark: "radar-panel-dark border-[#0B0B0B] text-white",
  territory: "radar-panel-dark border-[#0B0B0B] text-white",
  field: "radar-panel-dark border-[#0B0B0B] text-white",
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
    <section className={cn("radar-outline-card relative overflow-hidden rounded-[2px] border-2 border-black", compact ? "p-4 sm:p-5 xl:p-5 2xl:p-6" : "p-5 sm:p-6 2xl:p-8", heroStyles[variant], className)}>
      <div className={cn("pointer-events-none absolute inset-0 opacity-40", isLight ? "radar-grid" : "bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]")} />
      <div className={cn("relative grid", compact ? "gap-4 xl:gap-5" : "gap-6 2xl:gap-8", aside ? "2xl:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)]" : "")}>
        <div className={cn("min-w-0", compact ? "space-y-4" : "space-y-5 2xl:space-y-6")}>
          <div className={cn("flex flex-col", compact ? "gap-3" : "gap-4 2xl:gap-5")}>
            {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
            <div className={cn("max-w-3xl", compact ? "space-y-2" : "space-y-3")}>
              <div className="flex items-start gap-3">
                {icon ? (
                  <div className={cn("rounded-[2px] border-2 p-3", isLight ? "border-black bg-white" : "border-white bg-charcoal")}>
                    {icon}
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", isLight ? "text-cement" : "text-burnt-yellow")}>{eyebrow}</p>
                  <h1 className={cn(compact ? "mt-1 text-3xl font-black tracking-tight sm:text-[2.2rem] xl:text-[2.6rem]" : "mt-1 text-3xl font-black tracking-tight sm:text-4xl xl:text-[3.25rem]", isLight ? "text-charcoal" : "text-white", titleClassName)}>{title}</h1>
                </div>
              </div>
              <p className={cn(compact ? "max-w-3xl text-sm leading-6 sm:text-[0.95rem]" : "max-w-3xl text-sm leading-6 sm:text-base xl:text-[1.05rem] xl:leading-7", isLight ? "text-charcoal" : "font-medium text-zinc-300", descriptionClassName)}>{description}</p>
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
        "rounded-[2px] border-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] shadow-none",
        light ? "border-black bg-white text-charcoal" : "border-white bg-charcoal text-white",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
