import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-xl border border-[#e5dac8] bg-white/75 p-2", className)}>
      {children}
    </div>
  );
}

export function FilterPill({
  icon,
  label,
  value,
  className,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#dfd2bd] bg-white px-3 text-sm font-semibold text-[#264b3b]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b429]",
        className
      )}
      aria-label={`${label}: ${value}`}
    >
      {icon}
      <span>{value}</span>
    </button>
  );
}
