"use client";

import { LucideIcon, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type EthicalGuardrailBannerProps = {
  eyebrow?: string;
  title?: string;
  description: string;
  badgeLabel?: string;
  icon?: LucideIcon;
  tone?: "emerald" | "zinc" | "rose";
  className?: string;
};

const toneMap = {
  emerald: {
    shell: "border-emerald-100 bg-emerald-50/70",
    text: "text-emerald-950",
    muted: "text-emerald-700",
  },
  zinc: {
    shell: "border-zinc-200 bg-white",
    text: "text-zinc-950",
    muted: "text-zinc-600",
  },
  rose: {
    shell: "border-rose-100 bg-rose-50/70",
    text: "text-rose-950",
    muted: "text-rose-700",
  },
} as const;

export function EthicalGuardrailBanner({
  eyebrow = "Guardrail ético",
  title = "Leitura ética ativa",
  description,
  badgeLabel,
  icon: Icon = ShieldCheck,
  tone = "zinc",
  className,
}: EthicalGuardrailBannerProps) {
  const styles = toneMap[tone];

  return (
    <div className={cn("flex flex-col gap-4 rounded-[28px] border p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between", styles.shell, className)}>
      <div className="space-y-1">
        <p className={cn("text-[10px] font-black uppercase tracking-[0.24em]", styles.muted)}>{eyebrow}</p>
        <p className={cn("text-sm font-medium leading-relaxed", styles.muted)}>{description}</p>
      </div>
      <div className={cn("flex items-center gap-2 text-xs font-black uppercase tracking-widest", styles.text)}>
        <Icon className="h-4 w-4" />
        <span>{badgeLabel ?? title}</span>
      </div>
    </div>
  );
}
