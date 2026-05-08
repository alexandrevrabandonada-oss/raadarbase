import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RadarPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Compact mode: smaller title and reduced padding — use on high-frequency operational screens */
  compact?: boolean;
}

export function RadarPageHeader({
  eyebrow = "Radar de Base",
  title,
  description,
  actions,
  compact = false,
}: RadarPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-100",
        compact ? "mb-4 pb-4" : "mb-6 pb-6"
      )}
    >
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "font-black tracking-tight text-zinc-900",
            compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
          )}
        >
          {title}
        </h1>
        {description && !compact && (
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
        {description && compact && (
          <p className="mt-1 text-xs text-zinc-400 leading-snug max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
