"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type InfluenceProfile } from "@/lib/influence/types";

const ROW_HEIGHT = 72;
const VIEWPORT_HEIGHT = 576;
const OVERSCAN = 4;

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function VirtualizedProfileTable({ profiles }: { profiles: InfluenceProfile[] }) {
  const [scrollTop, setScrollTop] = useState(0);
  const window = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const count = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
    return { start, items: profiles.slice(start, start + count) };
  }, [profiles, scrollTop]);

  if (profiles.length === 0) return <p className="p-8 text-center text-sm text-muted-foreground">Nenhum perfil corresponde aos filtros.</p>;

  return (
    <div className="overflow-x-auto" aria-label="Ranking virtualizado de perfis">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_1fr] border-b-2 border-cement bg-muted/20 px-4 py-3 text-[10px] font-black uppercase tracking-wider">
          <span>Perfil</span><span>Categoria</span><span>Localização</span><span>Seguidores</span><span>Score</span>
        </div>
        <div className="overflow-y-auto" style={{ height: VIEWPORT_HEIGHT }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
          <div style={{ height: profiles.length * ROW_HEIGHT, position: "relative" }}>
            {window.items.map((profile, index) => (
              <Link
                key={profile.id}
                href={`/dashboard/influencia/${profile.id}`}
                className="absolute left-0 grid w-full grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_1fr] items-center border-b border-cement/30 px-4 transition-colors hover:bg-muted/20 focus-visible:outline-2 focus-visible:outline-ring"
                style={{ height: ROW_HEIGHT, top: (window.start + index) * ROW_HEIGHT }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-black">{profile.nome || `@${profile.username}`}</span>
                  <span className="block truncate text-xs text-muted-foreground">@{profile.username}{profile.conta_verificada ? " · verificada" : ""}</span>
                </span>
                <span><Badge variant="secondary">{CATEGORY_LABELS[profile.categoria]}</Badge></span>
                <span className="text-sm">{profile.cidade ?? "Não inferida"}{profile.estado ? ` / ${profile.estado}` : ""}</span>
                <span className="font-mono font-black">{formatNumber(profile.seguidores)}</span>
                <span className="font-mono text-lg font-black">{profile.influence_score.toFixed(1)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

