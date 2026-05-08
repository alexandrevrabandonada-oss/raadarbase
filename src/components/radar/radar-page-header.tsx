import { ReactNode } from "react";

interface RadarPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function RadarPageHeader({
  eyebrow = "Radar de Base",
  title,
  description,
  actions,
}: RadarPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-100 pb-6">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
