"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Map,
  MessageSquareText,
  ShieldCheck,
  Sprout,
  UsersRound,
  X,
} from "lucide-react";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/acoes", label: "Acoes", icon: ClipboardList },
  { href: "/escutas", label: "Escutas", icon: MessageSquareText },
  { href: "/escutas/lote", label: "Digitar fichas", icon: ClipboardList },
  { href: "/territorios", label: "Territorios", icon: UsersRound },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/relatorios", label: "Relatorios", icon: BarChart3 },
  { href: "/pos-banca", label: "Pos-banca", icon: FileText },
  { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
];

const mobileRouteMeta = [
  { match: ["/dashboard"], title: "Dashboard", action: { href: "/acoes/novo", label: "Nova acao" } },
  { match: ["/acoes/novo"], title: "Nova acao", action: null },
  { match: ["/acoes"], title: "Acoes", action: { href: "/acoes/novo", label: "Nova acao" } },
  { match: ["/escutas/lote"], title: "Digitar fichas", action: { href: "/escuta/bairro", label: "Escuta" } },
  { match: ["/escutas"], title: "Escutas", action: { href: "/escutas/lote", label: "Digitar" } },
  { match: ["/mapa"], title: "Mapa-lista", action: { href: "/campo/novo", label: "Acao" } },
  { match: ["/territorios"], title: "Territorios", action: { href: "/mapa", label: "Mapa" } },
  { match: ["/relatorios"], title: "Relatorios", action: null },
  { match: ["/pos-banca"], title: "Pos-banca", action: { href: "/relatorios", label: "Dossies" } },
  { match: ["/ajuda"], title: "Ajuda", action: null },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/" || pathname.startsWith("/dashboard");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SemearAppShell({
  children,
  userEmail,
  useMocks,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  useMocks?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentMeta =
    mobileRouteMeta.find((item) => item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) ??
    { title: "SEMEAR", action: null };

  const navigation = (
    <nav aria-label="Navegacao principal" className="flex flex-col gap-1">
      {primaryNavigation.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0b429] focus-visible:ring-offset-2 focus-visible:ring-offset-[#073d2b]",
              active
                ? "bg-white/13 text-[#f0b429] shadow-sm"
                : "text-white/88 hover:bg-white/9 hover:text-white"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7f1e6] text-[#0b3326]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#073d2b] px-5 py-6 text-white shadow-2xl shadow-emerald-950/20 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0b429] text-[#073d2b] shadow-lg shadow-black/10">
            <Sprout className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-black leading-tight tracking-tight">SEMEAR</p>
            <p className="text-lg font-black leading-tight tracking-tight">Territorios</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0b429]">
              Sistema interno
            </p>
          </div>
        </div>

        <div className="mt-10">{navigation}</div>

        <div className="mt-auto space-y-3">
          {useMocks ? (
            <div className="rounded-lg border border-amber-200/25 bg-amber-100/10 p-3 text-xs font-medium text-amber-50">
              Ambiente com dados simulados para verificacao segura.
            </div>
          ) : null}
          <div className="rounded-xl border border-white/12 bg-white/7 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/13">
                <ShieldCheck className="h-5 w-5 text-[#f0b429]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">Equipe Semear</p>
                <p className="truncate text-xs text-white/70">{userEmail ?? "Sessao interna"}</p>
              </div>
            </div>
            <div className="mt-3 [&_button]:w-full [&_button]:border-white/20 [&_button]:bg-transparent [&_button]:text-white [&_button:hover]:bg-white/10">
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <MobileHeader onMenuClick={() => setMenuOpen(true)} title={currentMeta.title} action={currentMeta.action} />

      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-[#0b3326]/40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <aside
            className="absolute inset-y-0 left-0 flex w-[88vw] max-w-sm flex-col bg-[#073d2b] px-5 py-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0b429] text-[#073d2b]">
                  <Sprout className="h-7 w-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-lg font-black leading-tight">SEMEAR</p>
                  <p className="text-lg font-black leading-tight">Territorios</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0b429]">Sistema interno</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/8"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-8">{navigation}</div>

            <div className="mt-auto space-y-3">
              {useMocks ? (
                <div className="rounded-lg border border-amber-200/25 bg-amber-100/10 p-3 text-xs font-medium text-amber-50">
                  Ambiente com dados simulados para verificacao segura.
                </div>
              ) : null}
              <div className="rounded-xl border border-white/12 bg-white/7 p-3">
                <p className="text-sm font-bold">Equipe Semear</p>
                <p className="mt-1 truncate text-xs text-white/70">{userEmail ?? "Sessao interna"}</p>
                <div className="mt-3 [&_button]:w-full [&_button]:border-white/20 [&_button]:bg-transparent [&_button]:text-white [&_button:hover]:bg-white/10">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto w-full max-w-[1580px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7 lg:pb-7">{children}</div>
      </main>
      <MobileBottomNav pathname={pathname} />
    </div>
  );
}
