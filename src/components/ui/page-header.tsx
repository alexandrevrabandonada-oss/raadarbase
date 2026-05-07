import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  actions,
  filters,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 space-y-4", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#a26615]">{eyebrow}</p>
          ) : null}
          <h1 className="text-3xl font-black tracking-tight text-[#0b3326] sm:text-4xl">{title}</h1>
          {description ? <p className="mt-2 text-base text-[#51645b]">{description}</p> : null}
        </div>
        {action || actions ? <div className="flex flex-wrap items-center gap-2">{actions ?? action}</div> : null}
      </div>
      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
    </header>
  );
}
