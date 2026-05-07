"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lightbulb, Plus } from "lucide-react";

export function MemoryNavActions() {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Link href="/memoria/sugestoes" className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium whitespace-nowrap transition-all hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50">
        <Lightbulb className="h-4 w-4 mr-2" /> Sugerir a partir dos resultados
      </Link>
      <Button type="button" onClick={() => router.push("/memoria/nova") }>
        <Plus className="h-4 w-4 mr-2" /> Nova Memória
      </Button>
    </div>
  );
}