"use client";

import { Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CompactModeToggleProps {
  enabled: boolean;
  autoCompact?: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function CompactModeToggle({
  enabled,
  autoCompact = false,
  onToggle,
  className,
}: CompactModeToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={enabled}
      onClick={() => onToggle(!enabled)}
      className={cn(
        "h-10 rounded-full border-[#d8c7ac] bg-white/88 px-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#11202a] hover:bg-[rgba(212,182,120,0.12)]",
        enabled && "border-[#13212b] bg-[#13212b] text-white hover:bg-[#0d1820]",
        className,
      )}
      title={autoCompact ? "Notebook ativo: a tela já entrou no modo compacto automaticamente." : "Ative o modo compacto para priorizar tarefa e reduzir leitura complementar."}
    >
      <Minimize2 className="mr-2 h-3.5 w-3.5" />
      Modo compacto
      {autoCompact ? <span className="ml-2 text-[9px] tracking-[0.12em] opacity-80">auto</span> : null}
    </Button>
  );
}
