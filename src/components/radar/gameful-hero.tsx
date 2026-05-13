"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GamefulHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  badges?: ReactNode;
  actions?: ReactNode;
  metrics?: ReactNode;
  aside?: ReactNode;
  variant?: "light" | "dark" | "territory" | "field";
  className?: string;
};

const heroStyles = {
  light: "border-zinc-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] text-zinc-950",
  dark: "border-zinc-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_26%),linear-gradient(145deg,#09090b_0%,#18181b_58%,#27272a_100%)] text-white",
  territory: "border-zinc-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.20),_transparent_24%),linear-gradient(145deg,#09090b_0%,#18181b_58%,#27272a_100%)] text-white",
  field: "border-zinc-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(145deg,#09090b_0%,#18181b_58%,#27272a_100%)] text-white",
} as const;

export function GamefulHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  badges,
  actions,
  metrics,
  aside,
  variant = "light",
  className,
}: GamefulHeroProps) {
  const isLight = variant === "light";

  return (
    <section className={cn("relative overflow-hidden rounded-[28px] border p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8", heroStyles[variant], className)}>
      <div className={cn("pointer-events-none absolute inset-0 opacity-40", isLight ? "bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" : "bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]")} />
      <div className={cn("relative grid gap-8", aside ? "xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]" : "")}>
        <div className="space-y-6">
          <div className="flex flex-col gap-5">
            {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-3">
                {Icon ? (
                  <div className={cn("rounded-2xl border p-3", isLight ? "border-zinc-200 bg-white/80" : "border-white/10 bg-white/10")}>
                    <Icon className="h-5 w-5" />
                  </div>
                ) : null}
                <div>
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", isLight ? "text-zinc-500" : "text-zinc-400")}>{eyebrow}</p>
                  <h1 className={cn("mt-1 font-black tracking-tight", isLight ? "text-4xl sm:text-5xl text-zinc-950" : "text-4xl text-white")}>{title}</h1>
                </div>
              </div>
              <p className={cn("max-w-3xl text-base leading-7 sm:text-lg", isLight ? "text-zinc-600" : "font-medium text-zinc-300")}>{description}</p>
            </div>
            {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
          </div>
          {metrics ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics}</div> : null}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
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
        light ? "border border-zinc-300 bg-white/80 text-zinc-600" : "border border-white/10 bg-white/10 text-white",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
