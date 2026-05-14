"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AlertBeaconProps = {
  icon: LucideIcon;
  title: string;
  value: number | string;
  detail: string;
  tone?: "healthy" | "warning" | "critical";
  href?: string;
  ctaLabel?: string;
  className?: string;
};

const toneMap = {
  healthy: {
    shell: "border-emerald-200 bg-emerald-50/70",
    icon: "text-emerald-600",
  },
  warning: {
    shell: "border-amber-200 bg-amber-50/70",
    icon: "text-amber-600",
  },
  critical: {
    shell: "border-rose-200 bg-rose-50/80",
    icon: "text-rose-600",
  },
} as const;

export function AlertBeacon({
  icon: Icon,
  title,
  value,
  detail,
  tone = "warning",
  href,
  ctaLabel = "Resolver",
  className,
}: AlertBeaconProps) {
  const styles = toneMap[tone];
  const body = (
    <Card className={cn("h-full border py-0 transition-transform duration-200 hover:-translate-y-0.5", styles.shell, className)}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/70", styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          {href ? <ArrowRight className="h-4 w-4 text-zinc-400" /> : null}
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{value}</p>
        </div>
        <p className="text-sm leading-6 text-zinc-600">{detail}</p>
        {href ? <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{ctaLabel}</p> : null}
      </CardContent>
    </Card>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  );
}
