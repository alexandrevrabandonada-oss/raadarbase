"use client";

import Link from "next/link";
import { ClipboardList, Home, MessageSquareText, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const bottomItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/acoes", label: "Acoes", icon: ClipboardList },
  { href: "/escutas/lote", label: "Digitar", icon: PlusSquare, featured: true },
  { href: "/escutas", label: "Escutas", icon: MessageSquareText },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/" || pathname.startsWith("/dashboard");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dbcdb8] bg-[#fffaf1]/98 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_35px_rgba(11,51,38,0.08)] lg:hidden">
      <div className="grid grid-cols-4 gap-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-bold transition",
                item.featured
                  ? active
                    ? "bg-[#f0b429] text-[#0b3326]"
                    : "bg-[#073d2b] text-white"
                  : active
                    ? "bg-[#e8f0e7] text-[#0b5a3f]"
                    : "text-[#54655d]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
