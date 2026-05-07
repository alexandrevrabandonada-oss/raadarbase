import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const statusStyles = {
  default: "bg-[#073d2b] text-white",
  attention: "bg-[#f0b429] text-[#0b3326]",
  calm: "bg-[#e7f1e8] text-[#0b5a3f]",
};

export function MetricCard({
  icon,
  label,
  value,
  note,
  status = "default",
  className,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  note?: ReactNode;
  status?: keyof typeof statusStyles;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#e5dac8] bg-white p-5 shadow-sm shadow-emerald-950/5",
        "transition hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {icon ? (
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", statusStyles[status])}>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#69786f]">{label}</p>
          <p className="mt-1 text-3xl font-black leading-none text-[#0b3326]">{value}</p>
          {note ? <p className="mt-2 text-xs font-semibold text-[#557065]">{note}</p> : null}
        </div>
      </div>
    </div>
  );
}
