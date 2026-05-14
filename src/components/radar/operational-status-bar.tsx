"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Metric Chip ───────────────────────────────────────────────────────────────
interface MetricChipProps {
  label: string;
  value: number | string;
  tone?: "neutral" | "hot" | "warning" | "danger" | "info" | "success";
  icon?: LucideIcon;
  /** Activates a filter-style highlight when true */
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

function MetricChip({
  label,
  value,
  tone = "neutral",
  icon: Icon,
  active,
  onClick,
  className,
}: MetricChipProps) {
  const toneClasses: Record<string, string> = {
    neutral: "text-zinc-700 border-zinc-200 bg-zinc-50 hover:bg-zinc-100",
    hot: "text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100",
    warning: "text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100",
    danger: "text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100",
    info: "text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100",
    success: "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
  };

  const activeClasses: Record<string, string> = {
    neutral: "bg-zinc-900 text-white border-zinc-900",
    hot: "bg-orange-600 text-white border-orange-600",
    warning: "bg-amber-600 text-white border-amber-600",
    danger: "bg-rose-600 text-white border-rose-600",
    info: "bg-indigo-600 text-white border-indigo-600",
    success: "bg-emerald-600 text-white border-emerald-600",
  };

  const base = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black transition-all";
  const resolved = active ? activeClasses[tone] ?? activeClasses.neutral : toneClasses[tone] ?? toneClasses.neutral;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, resolved, "cursor-pointer select-none", className)}
      >
        {Icon && <Icon className="h-3 w-3 shrink-0" />}
        <span className="tabular-nums">{value}</span>
        <span className="uppercase tracking-wider text-[9px]">{label}</span>
      </button>
    );
  }

  return (
    <span className={cn(base, resolved, "cursor-default", className)}>
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      <span className="tabular-nums">{value}</span>
      <span className="uppercase tracking-wider text-[9px]">{label}</span>
    </span>
  );
}

// ─── Operational Status Bar ────────────────────────────────────────────────────
export interface StatusMetric {
  id: string;
  label: string;
  value: number | string;
  tone?: MetricChipProps["tone"];
  icon?: LucideIcon;
  /** If true, clicking this chip calls onFilter(id) */
  filterable?: boolean;
}

interface OperationalStatusBarProps {
  metrics: StatusMetric[];
  /** Currently active filter id */
  activeFilter?: string;
  onFilter?: (id: string) => void;
  /** Extra actions shown on the right (e.g. Distribuir Tarefas) */
  actions?: React.ReactNode;
  className?: string;
}

export function OperationalStatusBar({
  metrics,
  activeFilter,
  onFilter,
  actions,
  className,
}: OperationalStatusBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-zinc-100 bg-white px-4 py-2 shadow-sm",
        className
      )}
    >
      {metrics.map((m) => (
        <MetricChip
          key={m.id}
          label={m.label}
          value={m.value}
          tone={m.tone}
          icon={m.icon}
          active={activeFilter === m.id}
          onClick={
            m.filterable && onFilter
              ? () => onFilter(activeFilter === m.id ? "todos" : m.id)
              : undefined
          }
        />
      ))}

      {actions && (
        <>
          <div className="ml-auto hidden h-4 w-px bg-zinc-200 sm:block" />
          <div className="flex items-center gap-2">{actions}</div>
        </>
      )}
    </div>
  );
}
