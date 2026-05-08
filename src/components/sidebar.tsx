"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Flame, 
  KanbanSquare, 
  MessageSquareText, 
  Map, 
  Users, 
  ClipboardList, 
  Play, 
  FileText, 
  Hash, 
  Lightbulb, 
  EarOff, 
  Cable, 
  Activity, 
  AlertCircle, 
  ShieldCheck, 
  Settings,
  ChevronDown,
  LayoutDashboard
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
};

const navigation: NavGroup[] = [
  {
    label: "Operar hoje",
    items: [
      { href: "/dashboard", label: "Hoje no Radar", icon: LayoutDashboard },
      { href: "/pessoas", label: "Pessoas Prioritárias", icon: Flame },
      { href: "/abordagem", label: "Quadro de Vínculos", icon: KanbanSquare },
      { href: "/mensagens", label: "Biblioteca de DMs", icon: MessageSquareText },
    ],
  },
  {
    label: "Encaminhar e executar",
    items: [
      { href: "/campo", label: "Agenda de Campo", icon: Map },
      { href: "/voluntarios", label: "Base de Voluntários", icon: Users },
      { href: "/acoes", label: "Plano de Ação", icon: ClipboardList },
      { href: "/execucao", label: "Execução", icon: Play },
    ],
  },
  {
    label: "Aprender e decidir",
    items: [
      { href: "/relatorios", label: "Relatórios e Piloto", icon: FileText },
      { href: "/temas", label: "Temas e Pautas", icon: Hash },
      { href: "/memoria", label: "Memória Estratégica", icon: Lightbulb },
      { href: "/radar/silencios", label: "Radar de Silêncios", icon: EarOff },
    ],
  },
  {
    label: "Sistema",
    collapsible: true,
    items: [
      { href: "/integracoes/meta", label: "Conexão Instagram", icon: Cable },
      { href: "/operacao", label: "Saúde do Sistema", icon: Activity },
      { href: "/operacao/incidentes", label: "Incidentes", icon: AlertCircle },
      { href: "/governanca", label: "Ética e Dados", icon: ShieldCheck },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export function Sidebar({ 
  userEmail, 
  useMocks,
  className 
}: { 
  userEmail: string | undefined; 
  useMocks: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({ "Sistema": true });

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className={cn(
      "border-border/80 bg-card/80 px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200",
      className
    )}>
      <Link href="/dashboard" className="flex items-center gap-3 mb-6 shrink-0">
        <div className="flex size-11 items-center justify-center rounded-xl bg-black text-white font-black text-lg shadow-lg">
          RB
        </div>
        <div className="min-w-0">
          <p className="text-base font-black leading-tight truncate">Radar de Base</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">VR Abandonada</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6">
        {navigation.map((group) => (
          <div key={group.label} className="space-y-1">
            <button 
              onClick={() => group.collapsible && toggleGroup(group.label)}
              className={cn(
                "flex items-center justify-between w-full px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 group",
                group.collapsible && "cursor-pointer hover:text-foreground"
              )}
            >
              {group.label}
              {group.collapsible && (
                <ChevronDown className={cn("h-3 w-3 transition-transform", collapsedGroups[group.label] && "-rotate-90")} />
              )}
            </button>
            
            {!collapsedGroups[group.label] && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all",
                        isActive 
                          ? "bg-black text-white shadow-md shadow-black/10" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-6 space-y-4 shrink-0">
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 text-[10px] font-bold leading-tight text-orange-800">
          ⚠️ ENVIO MANUAL: Toda mensagem deve ser humana. Proibido disparo em massa.
        </div>

        {useMocks && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-[10px] font-bold leading-tight text-blue-800">
            MODO DEMO: Dados simulados.
          </div>
        )}

        <div className="rounded-xl border bg-background p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Sessão</p>
          <p className="mt-1 text-[11px] font-bold truncate text-foreground">{userEmail ?? "Sem sessão"}</p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
