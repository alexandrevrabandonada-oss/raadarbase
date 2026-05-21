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
    "font-black uppercase tracking-[0.16em] rounded-[2px] border-2 transition-all",
    compact ? "h-10 px-4 text-[10px]" : "h-11 px-5 text-[11px]",
    action.tone === "primary" && "bg-burnt-yellow text-charcoal border-charcoal hover:bg-burnt-yellow/90 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] dark:border-off-white dark:shadow-[2px_2px_0px_0px_rgba(231,224,210,0.5)]",
    action.tone === "secondary" && "border-cement bg-charcoal text-off-white hover:bg-cement/10",
    action.tone === "ghost" && "border-transparent text-zinc-400 hover:text-off-white hover:bg-cement/10",
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
        "hidden xl:sticky xl:top-4 xl:z-30 xl:block xl:px-0 xl:pb-0",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="radar-outline-card rounded-[4px] border-2 border-burnt-yellow bg-charcoal/95 p-3 shadow-[4px_4px_0px_0px_rgba(242,169,0,0.3)] backdrop-blur-md xl:p-4">
          <div className="space-y-3 xl:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">{title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cement">{statusLabel}</p>
                  <p className="text-xs font-black text-off-white">{statusValue}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-[2px] border-2 border-cement bg-charcoal/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-off-white">
                <ShieldCheck className="h-3 w-3 text-burnt-yellow animate-pulse" />
                Manual
              </span>
            </div>
            {statusDetail ? <p className="text-xs leading-5 text-zinc-300">{statusDetail}</p> : null}
            <ActionButton action={{ ...primaryAction, tone: "primary" }} compact />
            {(secondaryActions.length > 0 || shortcutAction) ? (
              <details className="rounded-[2px] border-2 border-cement bg-charcoal/60 px-3 py-2">
                <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.2em] text-burnt-yellow">
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

          <div className="hidden xl:grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">{title}</p>
                <span className="inline-flex items-center gap-1 rounded-[2px] border-2 border-cement bg-charcoal/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-off-white">
                  <ShieldCheck className="h-3 w-3 text-burnt-yellow animate-pulse" />
                  Manual
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cement">{statusLabel}</p>
                <p className="text-sm font-black text-off-white">{statusValue}</p>
              </div>
              {statusDetail ? <p className="text-xs leading-5 text-zinc-300">{statusDetail}</p> : null}
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
