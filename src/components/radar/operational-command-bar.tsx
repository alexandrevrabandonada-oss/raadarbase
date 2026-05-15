"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommandAction = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  tone?: "primary" | "secondary" | "ghost";
};

interface OperationalCommandBarProps {
  title: string;
  statusLabel: string;
  statusValue: string;
  statusDetail?: string;
  primaryAction: CommandAction;
  secondaryActions?: CommandAction[];
  shortcutAction?: CommandAction;
  className?: string;
}

function ActionButton({ action, compact = false }: { action: CommandAction; compact?: boolean }) {
  const Icon = action.icon;
  const className = cn(
    "font-black uppercase tracking-[0.16em]",
    compact ? "h-10 px-4 text-[10px]" : "h-11 px-5 text-[11px]",
    action.tone === "primary" && "bg-[#13212b] text-white hover:bg-[#0d1820]",
    action.tone === "secondary" && "border-[#d4c4a8] bg-white text-[#13212b] hover:bg-[rgba(212,182,120,0.08)]",
    action.tone === "ghost" && "text-[#6f6250] hover:bg-[rgba(17,32,42,0.05)]",
  );

  if (action.href) {
    return (
      <Button
        variant={action.tone === "ghost" ? "ghost" : "outline"}
        className={className}
        disabled={action.disabled}
        nativeButton={false}
        title={action.title}
        render={<Link href={action.href} />}
      >
        {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
        {action.label}
      </Button>
    );
  }

  return (
    <Button
      variant={action.tone === "ghost" ? "ghost" : "outline"}
      className={className}
      disabled={action.disabled}
      title={action.title}
      onClick={action.onClick}
    >
      {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
      {action.label}
    </Button>
  );
}

export function OperationalCommandBar({
  title,
  statusLabel,
  statusValue,
  statusDetail,
  primaryAction,
  secondaryActions = [],
  shortcutAction,
  className,
}: OperationalCommandBarProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] xl:sticky xl:top-4 xl:z-30 xl:px-0 xl:pb-0",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="radar-outline-card rounded-[24px] border border-[#d8c7ac] bg-[rgba(255,250,242,0.96)] p-3 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur-md xl:p-4">
          <div className="space-y-3 xl:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7d6f59]">{title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7962]">{statusLabel}</p>
                  <p className="text-xs font-black text-[#13212b]">{statusValue}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#d8c7ac] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#13212b]">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Manual
              </span>
            </div>
            {statusDetail ? <p className="text-xs leading-5 text-[#6f6250]">{statusDetail}</p> : null}
            <ActionButton action={{ ...primaryAction, tone: "primary" }} compact />
            {(secondaryActions.length > 0 || shortcutAction) ? (
              <details className="rounded-2xl border border-[#d8c7ac] bg-white/70 px-3 py-2">
                <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.2em] text-[#7d6f59]">
                  Ver mais ações
                </summary>
                <div className="mt-3 grid gap-2">
                  {secondaryActions.map((action) => (
                    <ActionButton
                      key={`${action.label}-${action.href ?? "click"}`}
                      action={{ ...action, tone: action.tone ?? "secondary" }}
                      compact
                    />
                  ))}
                  {shortcutAction ? (
                    <ActionButton
                      action={{
                        ...shortcutAction,
                        tone: "ghost",
                        icon: shortcutAction.icon ?? ArrowUpRight,
                      }}
                      compact
                    />
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>

          <div className="hidden grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7d6f59]">{title}</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#d8c7ac] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#13212b]">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Manual
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7962]">{statusLabel}</p>
                <p className="text-sm font-black text-[#13212b]">{statusValue}</p>
              </div>
              {statusDetail ? <p className="text-xs leading-5 text-[#6f6250]">{statusDetail}</p> : null}
            </div>

            <div className="flex flex-col gap-2 xl:items-end">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
                <ActionButton action={{ ...primaryAction, tone: "primary" }} />
                {secondaryActions.map((action) => (
                  <ActionButton
                    key={`${action.label}-${action.href ?? "click"}`}
                    action={{ ...action, tone: action.tone ?? "secondary" }}
                    compact
                  />
                ))}
              </div>
              {shortcutAction ? (
                <ActionButton
                  action={{
                    ...shortcutAction,
                    tone: "ghost",
                    icon: shortcutAction.icon ?? ArrowUpRight,
                  }}
                  compact
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
