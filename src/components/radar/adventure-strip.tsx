"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Flag,
  Landmark,
  Map,
  Route,
  Sparkles,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdventureProgress, AdventureWorldId } from "@/lib/data/adventure-progress";
import { playSynthSuccess } from "@/lib/audio";

type AdventureWorld = {
  id: AdventureWorldId;
  href: string;
  label: string;
  challenge: string;
  target: number;
  icon: LucideIcon;
  match: string[];
};

const worlds: AdventureWorld[] = [
  {
    id: "journey",
    href: "/mensagens",
    label: "Anuncio",
    challenge: "Registre 3 retornos",
    target: 3,
    icon: Route,
    match: ["/mensagens", "/minha-fila", "/pessoas", "/abordagem"],
  },
  {
    id: "territory",
    href: "/relatorios/territorios",
    label: "Territorio",
    challenge: "Registre 1 leitura",
    target: 1,
    icon: Map,
    match: ["/relatorios/territorios", "/territorios", "/temas"],
  },
  {
    id: "field",
    href: "/campo",
    label: "Campo",
    challenge: "Feche 1 acao",
    target: 1,
    icon: Landmark,
    match: ["/campo", "/voluntarios"],
  },
  {
    id: "memory",
    href: "/memoria",
    label: "Memoria",
    challenge: "Guarde 1 aprendizado",
    target: 1,
    icon: BookOpenCheck,
    match: ["/memoria", "/relatorios"],
  },
  {
    id: "command",
    href: "/ritmo",
    label: "Comando",
    challenge: "Feche 1 execucao",
    target: 1,
    icon: Flag,
    match: ["/ritmo", "/acoes", "/execucao", "/radar"],
  },
];

function isCurrentWorld(pathname: string, world: AdventureWorld) {
  return world.match.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getProgressStorageKey() {
  return `radar-adventure-progress:${new Date().toISOString().slice(0, 10)}`;
}

function parseStoredProgress(value: string | null): AdventureProgress | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<AdventureProgress>;
    if (
      typeof parsed.journey === "number" &&
      typeof parsed.territory === "number" &&
      typeof parsed.field === "number" &&
      typeof parsed.memory === "number" &&
      typeof parsed.command === "number"
    ) {
      return parsed as AdventureProgress;
    }
  } catch {
    return null;
  }

  return null;
}

export function AdventureStrip({ progress }: { progress: AdventureProgress }) {
  const pathname = usePathname() ?? "";
  const [rewardWorld, setRewardWorld] = useState<AdventureWorld | null>(null);
  const currentIndex = Math.max(worlds.findIndex((world) => isCurrentWorld(pathname, world)), 0);
  const currentWorld = worlds[currentIndex];
  const nextWorld = worlds[(currentIndex + 1) % worlds.length];
  const currentProgress = Math.min(progress[currentWorld.id], currentWorld.target);
  const completedWorlds = worlds.filter((world) => progress[world.id] >= world.target).length;

  useEffect(() => {
    const storageKey = getProgressStorageKey();
    const previous = parseStoredProgress(window.localStorage.getItem(storageKey));
    window.localStorage.setItem(storageKey, JSON.stringify(progress));

    if (!previous) return;

    const completedNow = worlds.find(
      (world) => previous[world.id] < world.target && progress[world.id] >= world.target,
    );

    if (!completedNow) return;

    playSynthSuccess();
    window.setTimeout(() => {
      setRewardWorld(completedNow);
      window.setTimeout(() => setRewardWorld(null), 5200);
    }, 0);
  }, [progress]);

  return (
    <section className="radar-paper relative border-b-2 border-cement" aria-label="Mapa da jornada">
      <div className="mx-auto grid w-full max-w-[1680px] gap-3 px-4 py-3 sm:px-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:px-6">
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cement">
          {worlds.map((world, index) => {
            const Icon = world.icon;
            const active = index === currentIndex;
            const currentValue = Math.min(progress[world.id], world.target);
            const completed = currentValue >= world.target;

            return (
              <Link
                key={world.href}
                href={world.href}
                title={world.challenge}
                className={cn(
                  "flex min-w-[9.5rem] items-center gap-2 border-2 px-3 py-2 transition-colors",
                  active
                    ? "border-charcoal bg-charcoal text-off-white shadow-[2px_2px_0px_0px_rgba(242,169,0,1)]"
                    : "border-cement bg-white/55 text-charcoal hover:border-charcoal hover:bg-white",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center border-2",
                    active ? "border-burnt-yellow text-burnt-yellow" : "border-cement text-cement",
                  )}
                >
                  {completed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-[0.18em] opacity-70">
                    Mundo {index + 1}
                  </span>
                  <span className="block truncate text-xs font-black">{world.label}</span>
                  <span className="block text-[9px] font-black uppercase tracking-[0.16em] opacity-70">
                    {currentValue}/{world.target} hoje
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href={currentWorld.href}
          className="flex min-w-0 items-center justify-between gap-3 border-2 border-charcoal bg-burnt-yellow px-3 py-2 text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">Desafio atual</p>
              <p className="truncate text-xs font-black">
                {currentWorld.challenge} {currentProgress}/{currentWorld.target}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-1 border-l-2 border-charcoal/20 pl-3 text-[10px] font-black uppercase tracking-[0.16em] sm:flex">
            {completedWorlds}/{worlds.length} mundos
            <span className="mx-1 opacity-40">|</span>
            Depois: {nextWorld.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
      {rewardWorld ? (
        <div className="pointer-events-none mx-auto mb-3 w-[min(24rem,calc(100vw-2rem))] border-2 border-charcoal bg-charcoal p-3 text-off-white shadow-[4px_4px_0px_0px_rgba(242,169,0,1)] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center border-2 border-burnt-yellow bg-burnt-yellow text-charcoal">
              <Check className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-burnt-yellow">
                Desafio concluido
              </p>
              <p className="truncate text-sm font-black">{rewardWorld.label}: {rewardWorld.challenge}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
