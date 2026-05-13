"use client";

import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GamefulPortalCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  status: string;
  nextStep: string;
  href: string;
  ctaLabel: string;
  className?: string;
};

export function GamefulPortalCard({
  icon: Icon,
  title,
  description,
  status,
  nextStep,
  href,
  ctaLabel,
  className,
}: GamefulPortalCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className={cn("h-full border-zinc-200 py-0 shadow-[0_16px_44px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl", className)}>
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900">
              <Icon className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400" />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{status}</p>
            <h3 className="text-xl font-black tracking-tight text-zinc-950">{title}</h3>
            <p className="text-sm leading-6 text-zinc-600">{description}</p>
          </div>

          <div className="mt-auto rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Próximo passo</p>
            <p className="mt-2 text-sm font-black text-indigo-950">{nextStep}</p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{ctaLabel}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
