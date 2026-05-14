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
    <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">
          {suggestion.type.replaceAll("_", " ")}
        </Badge>
        <span className="text-xs font-semibold text-zinc-500">{suggestion.sourceCount} sinais</span>
      </div>
      <h3 className="mt-3 text-lg font-black tracking-tight text-zinc-950">{suggestion.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{suggestion.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button nativeButton={false} size="sm" className="bg-indigo-600 font-bold hover:bg-indigo-700" render={<Link href={suggestion.href} />}>
          {isFieldRecord ? "Criar memória" : "Abrir memória"}
        </Button>
        {suggestion.sourceHref ? (
          <Button nativeButton={false} size="sm" variant="outline" className="border-indigo-200 bg-white text-indigo-700" render={<Link href={suggestion.sourceHref} />}>
            Ver origem
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" className="text-zinc-500" onClick={() => setDismissed(true)}>
          Adiar
        </Button>
      </div>
    </div>
  );
}
