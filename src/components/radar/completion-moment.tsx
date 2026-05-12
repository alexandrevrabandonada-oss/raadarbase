"use client";

import * as React from "react";
import { CheckCircle2, ShieldCheck, Sparkles, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompletionMomentProps {
  type: "success" | "celebration" | "protection";
  title: string;
  subtitle?: string;
  className?: string;
}

const MOMENT_CONFIG = {
  success: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  celebration: {
    icon: PartyPopper,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  protection: {
    icon: ShieldCheck,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
};

export function CompletionMoment({ type, title, subtitle, className }: CompletionMomentProps) {
  const config = MOMENT_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-6 rounded-3xl flex items-start gap-4 animate-in zoom-in-95 fade-in duration-500",
      config.bg,
      className
    )}>
      <div className={cn("p-3 rounded-2xl bg-white shadow-sm", config.color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-lg font-black text-zinc-900 leading-tight flex items-center gap-2">
          {title}
          {type === "celebration" && <Sparkles className="h-4 w-4 text-amber-400" />}
        </h4>
        {subtitle && (
          <p className="text-sm font-medium text-zinc-500 leading-relaxed italic">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
