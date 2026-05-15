"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lightbulb, Plus } from "lucide-react";

export function MemoryNavActions() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/memoria/sugestoes" className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-3 h-9 text-xs font-bold whitespace-nowrap transition-all hover:bg-muted hover:text-foreground sm:w-auto dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
        <Lightbulb className="h-4 w-4 mr-2" /> Sugerir a partir dos resultados
      </Link>
      <Button type="button" className="w-full sm:w-auto" onClick={() => router.push("/memoria/nova") }>
        <Plus className="h-4 w-4 mr-2" /> Nova Memória
      </Button>
    </div>
  );
}
