"use client";

import Link from "next/link";
import { Menu, Plus, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

type MobileAction = {
  href: string;
  label: string;
};

export function MobileHeader({
  onMenuClick,
  title,
  action,
}: {
  onMenuClick: () => void;
  title: string;
  action?: MobileAction | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e2d7c4] bg-[#f7f1e6]/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMenuClick}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d9ccb8] bg-white text-[#073d2b]"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2 text-[#073d2b]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0b429]">
                <Sprout className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-black uppercase tracking-[0.16em] text-[#a26615]">Semear</span>
                <span className="block truncate text-sm font-black">{title}</span>
              </span>
            </Link>
          </div>
        </div>
        {action ? (
          <Button
            size="sm"
            className="h-11 rounded-xl bg-[#f0b429] px-3 text-[#0b3326] hover:bg-[#d99d16]"
            nativeButton={false}
            render={<Link href={action.href} />}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            {action.label}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
