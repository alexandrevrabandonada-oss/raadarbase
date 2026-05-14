"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  AlertCircle,
  BookOpenCheck,
  Cable,
  ChevronDown,
  ClipboardList,
  Flame,
  Gauge,
  Hash,
  KanbanSquare,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Map,
  MessageSquareText,
  Play,
  Radar,
  Route,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  microcopy: string;
  match?: string[];
};

type NavGroup = {
  label: string;
  description: string;
  items: NavItem[];
  collapsible?: boolean;
};

const navigation: NavGroup[] = [
  {
    label: "Base",
    description: "Centro da operação.",
    items: [
      {
        href: "/dashboard",
        label: "Base de Operações",
        icon: LayoutDashboard,
        microcopy: "Ver sinais, missão do dia e portais da operação.",
      },
    ],
  },
  {
    label: "Jornada",
    description: "Missões e vínculos.",
    items: [
      {
        href: "/minha-fila",
        label: "Minha Jornada",
        icon: Route,
        microcopy: "Continuar a próxima missão com trilha guiada.",
      },
      {
        href: "/pessoas",
        label: "Prioridades da Equipe",
        icon: Flame,
        microcopy: "Ler contexto, risco e próxima ação dos vínculos.",
      },
      {
        href: "/abordagem",
        label: "Mural de Missões",
        icon: KanbanSquare,
        microcopy: "Mover cada missão entre preparar, conversar e concluir.",
      },
      {
        href: "/mensagens",
        label: "Modelos de Mensagem",
        icon: MessageSquareText,
        microcopy: "Preparar abordagens humanas com guardrails claros.",
      },
    ],
  },
  {
    label: "Território",
    description: "Bairros, temas e tração.",
    items: [
      {
        href: "/relatorios/territorios",
        label: "Mapa da Mobilização",
        icon: Map,
        microcopy: "Ler calor, fase e ação recomendada por bairro.",
        match: ["/territorios", "/relatorios/territorios"],
      },
      {
        href: "/temas",
        label: "Temas e Pautas",
        icon: Hash,
        microcopy: "Ver o que puxa território, campo e continuidade.",
      },
    ],
  },
  {
    label: "Campo",
    description: "Convites, presença e fechamento.",
    items: [
      {
        href: "/campo",
        label: "Missões de Campo",
        icon: Landmark,
        microcopy: "Acompanhar convites, confirmações e follow-up.",
      },
      {
        href: "/voluntarios",
        label: "Base de Voluntários",
        icon: Users,
        microcopy: "Cuidar da presença recorrente e apoio à campanha.",
      },
    ],
  },
  {
    label: "Memória",
    description: "Aprendizados e continuidade.",
    items: [
      {
        href: "/memoria",
        label: "Memória da Equipe",
        icon: Lightbulb,
        microcopy: "Revisar registros que sustentam decisões futuras.",
      },
      {
        href: "/relatorios",
        label: "Relatórios e Piloto",
        icon: BookOpenCheck,
        microcopy: "Fechar ciclos, publicar leituras e abrir decisões.",
      },
    ],
  },
  {
    label: "Comando",
    description: "Ritmo e coordenação.",
    items: [
      {
        href: "/ritmo",
        label: "Central de Ritmo",
        icon: Gauge,
        microcopy: "Ver carga, travas e cuidado da base.",
      },
      {
        href: "/acoes",
        label: "Plano de Ação",
        icon: ClipboardList,
        microcopy: "Transformar leitura em campanhas e frentes concretas.",
      },
      {
        href: "/execucao",
        label: "Execução",
        icon: Play,
        microcopy: "Acompanhar o que já está rodando em campo e rede.",
      },
      {
        href: "/radar/silencios",
        label: "Ações Sugeridas",
        icon: Radar,
        microcopy: "Ler silêncios e descobrir onde agir em seguida.",
      },
    ],
  },
  {
    label: "Sistema",
    description: "Infraestrutura e governança.",
    collapsible: true,
    items: [
      {
        href: "/integracoes/meta",
        label: "Conexão Instagram",
        icon: Cable,
        microcopy: "Ver integração, sync e saúde da entrada de dados.",
      },
      {
        href: "/operacao",
        label: "Saúde do Sistema",
        icon: Activity,
        microcopy: "Conferir filas técnicas, syncs e estabilidade.",
      },
      {
        href: "/operacao/incidentes",
        label: "Incidentes",
        icon: AlertCircle,
        microcopy: "Rastrear eventos críticos e pontos de atenção.",
      },
      {
        href: "/governanca",
        label: "Ética e Dados",
        icon: ShieldCheck,
        microcopy: "Auditar guardrails, risco e revisão de dados.",
      },
      {
        href: "/configuracoes",
        label: "Configurações",
        icon: Settings,
        microcopy: "Ajustar parâmetros operacionais do ambiente.",
      },
    ],
  },
];

function matchesPath(pathname: string | null, item: NavItem) {
  if (!pathname) return false;

  const candidates = item.match ?? [item.href];
  return candidates.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

export function Sidebar({
  userEmail,
  useMocks,
  className,
  mobile = false,
}: {
  userEmail: string | undefined;
  useMocks: boolean;
  className?: string;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({ Sistema: true });

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={cn(
        "radar-panel-dark flex flex-col overflow-y-auto border-r border-[#23313b] px-4 py-4 text-white scrollbar-thin scrollbar-thumb-[#425362] lg:sticky lg:top-0 lg:h-screen lg:w-72",
        className,
      )}
    >
      <Link href="/dashboard" className="mb-5 shrink-0 rounded-[22px] border border-white/8 bg-white/4 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-[#e5b44c]/40 bg-[#0c141b] text-lg font-black text-[#f1c15a] shadow-lg">
            RB
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black leading-tight text-white">Radar de Base</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4b678]">
              Base de Operações
            </p>
          </div>
        </div>
        {mobile ? (
          <p className="mt-3 text-xs font-medium leading-5 text-zinc-300">
            Navegue por mundos conectados da operação: jornada, território, campo, memória e comando.
          </p>
        ) : null}
      </Link>

      <nav className="flex-1 space-y-4">
        {navigation.map((group) => {
          const isCollapsed = Boolean(collapsedGroups[group.label]);
          return (
            <section key={group.label} className="rounded-[24px] border border-white/6 bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <button
                onClick={() => group.collapsible && toggleGroup(group.label)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 text-left",
                  group.collapsible ? "cursor-pointer" : "cursor-default",
                )}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d4b678]">{group.label}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-400">{group.description}</p>
                </div>
                {group.collapsible ? (
                  <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform", isCollapsed && "-rotate-90")} />
                ) : null}
              </button>

              {!isCollapsed ? (
                <div className="mt-3 space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = matchesPath(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.microcopy}
                        className={cn(
                          "group block rounded-[18px] border px-3 py-3 transition-all duration-200",
                          isActive
                            ? "border-[#d39b2a]/60 bg-[#15222c] text-white shadow-[0_14px_30px_rgba(0,0,0,0.28)]"
                            : "border-transparent bg-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                              isActive
                                ? "border-[#f0b640]/40 bg-[#f0b640]/12 text-[#f0c15b]"
                                : "border-white/10 bg-black/20 text-zinc-400 group-hover:border-white/16 group-hover:text-white",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[13px] font-black leading-4 tracking-tight" title={item.label}>{item.label}</p>
                            <p
                              className={cn(
                                "mt-1 line-clamp-1 text-[10px] leading-4 transition-colors",
                                isActive
                                  ? "text-zinc-300"
                                  : mobile
                                    ? "text-zinc-400"
                                    : "text-zinc-500 group-hover:text-zinc-300",
                              )}
                            >
                              {item.microcopy}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </nav>

      <div className="mt-5 space-y-3 shrink-0">
        <div className="rounded-[20px] border border-[#d39b2a]/28 bg-[#d39b2a]/10 p-3 text-[11px] font-bold leading-5 text-[#f0c15b]">
          Envio manual: toda mensagem deve ser humana. Proibido disparo em massa.
        </div>

        {useMocks ? (
          <div className="rounded-[20px] border border-sky-300/18 bg-sky-400/10 p-3 text-[11px] font-bold leading-5 text-sky-200">
            Modo demo ativo: dados simulados para leitura e validacao.
          </div>
        ) : null}

        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4b678]">Sessão</p>
          <p className="mt-1 truncate text-[11px] font-bold text-white">{userEmail ?? "Sem sessão"}</p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
