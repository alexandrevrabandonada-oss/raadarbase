import Link from "next/link";
import {
  BarChart3,
  Cable,
  Activity,
  KanbanSquare,
  MessageSquareText,
  Settings,
  Users,
  ShieldCheck,
  AlertCircle,
  Hash,
  FileText,
  ClipboardList,
  Play,
  Lightbulb
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/logout-button";
import { getInternalSession } from "@/lib/supabase/auth";
import { USE_MOCKS } from "@/lib/config";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/acoes", label: "Ações", icon: ClipboardList },
  { href: "/execucao", label: "Execução", icon: Play },
  { href: "/memoria", label: "Memória", icon: Lightbulb },
  { href: "/temas", label: "Temas", icon: Hash },
  { href: "/pessoas", label: "Pessoas", icon: Users },
  { href: "/abordagem", label: "Abordagem", icon: KanbanSquare },
  { href: "/mensagens", label: "Mensagens", icon: MessageSquareText },
  { href: "/integracoes/meta", label: "Integração Meta", icon: Cable },
  { href: "/operacao", label: "Operação", icon: Activity },
  { href: "/operacao/incidentes", label: "Incidentes", icon: AlertCircle },
  { href: "/governanca", label: "Conformidade", icon: ShieldCheck },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getInternalSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-border/80 bg-card/80 px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              RB
            </div>
            <div>
              <p className="text-lg font-black leading-tight">Radar de Base</p>
              <p className="text-sm text-muted-foreground">VR Abandonada</p>
            </div>
          </Link>
          <Separator className="my-4" />
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon data-icon="inline-start" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 rounded-md border border-yellow-500/40 bg-yellow-100 p-3 text-sm font-medium text-black">
            Envio manual. Não use para disparo em massa.
          </div>
          {USE_MOCKS ? (
            <div className="mt-4 rounded-md border border-orange-600/30 bg-orange-100 p-3 text-sm font-medium text-orange-950">
              Modo demonstracao: dados ficticios.
            </div>
          ) : null}
          <div className="mt-4 rounded-md border bg-background p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Sessão interna</p>
            <p className="mt-1 break-all">{user?.email ?? "Sem sessão ativa"}</p>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </aside>
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
