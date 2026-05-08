import { Badge } from "@/components/ui/badge";
import { Flame, ThermometerSnowflake, Eye, ThermometerSun } from "lucide-react";
import { cn } from "@/lib/utils";

type TemperatureLevel = "muito_quente" | "quente" | "morno" | "frio" | "observar" | string;

export function TemperatureBadge({ level, className }: { level: TemperatureLevel, className?: string }) {
  const l = level.toLowerCase();
  
  if (l.includes("muito") || l === "muito_quente") {
    return (
      <Badge variant="outline" className={cn("border-red-200 bg-red-50 text-red-700 font-black uppercase text-[10px] tracking-wider", className)}>
        <Flame className="h-3 w-3 mr-1 fill-red-500 text-red-500" />
        Muito quente
      </Badge>
    );
  }

  if (l === "quente") {
    return (
      <Badge variant="outline" className={cn("border-orange-200 bg-orange-50 text-orange-700 font-bold uppercase text-[10px] tracking-wider", className)}>
        <Flame className="h-3 w-3 mr-1 text-orange-500" />
        Quente
      </Badge>
    );
  }

  if (l === "morno") {
    return (
      <Badge variant="outline" className={cn("border-amber-200 bg-amber-50 text-amber-700 font-bold uppercase text-[10px] tracking-wider", className)}>
        <ThermometerSun className="h-3 w-3 mr-1" />
        Morno
      </Badge>
    );
  }

  if (l === "frio") {
    return (
      <Badge variant="outline" className={cn("border-blue-200 bg-blue-50 text-blue-700 font-bold uppercase text-[10px] tracking-wider", className)}>
        <ThermometerSnowflake className="h-3 w-3 mr-1" />
        Frio
      </Badge>
    );
  }

  // Observar fallback
  return (
    <Badge variant="outline" className={cn("border-zinc-200 bg-zinc-50 text-zinc-600 font-bold uppercase text-[10px] tracking-wider", className)}>
      <Eye className="h-3 w-3 mr-1" />
      Observar
    </Badge>
  );
}
