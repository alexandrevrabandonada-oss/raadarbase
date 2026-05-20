"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FieldMemorySuggestion } from "@/lib/field-memory/field-memory-loop";

export function MemoryEngineSuggestionCard({ suggestion }: { suggestion: FieldMemorySuggestion }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const isFieldRecord = suggestion.type === "REGISTRO_DE_CAMPO";

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 transition-all hover:bg-amber-50/80">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline" className="border-amber-200 bg-amber-100 text-[9px] font-black uppercase tracking-[0.16em] text-amber-800">
          {suggestion.type.replaceAll("_", " ")}
        </Badge>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{suggestion.sourceCount} sinais</span>
      </div>
      <h3 className="mt-3 text-base font-black tracking-tight text-[#3c2f2f]">{suggestion.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-stone-600 font-semibold">{suggestion.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button nativeButton={false} size="sm" className="bg-amber-700 text-white font-black uppercase text-[10px] tracking-wider hover:bg-amber-800" render={<Link href={suggestion.href} />}>
          {isFieldRecord ? "Criar memória" : "Abrir memória"}
        </Button>
        {suggestion.sourceHref ? (
          <Button nativeButton={false} size="sm" variant="outline" className="border-amber-300 bg-white text-amber-800 font-black uppercase text-[10px] tracking-wider" render={<Link href={suggestion.sourceHref} />}>
            Ver origem
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" className="text-stone-500 font-bold text-[10px] uppercase tracking-wider hover:bg-amber-100/50" onClick={() => setDismissed(true)}>
          Adiar
        </Button>
      </div>
    </div>
  );
}
