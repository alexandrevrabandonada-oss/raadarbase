import { Badge } from "@/components/ui/badge";
import { statusLabels } from "@/lib/mock-data";
import type { PersonStatus } from "@/lib/types";

const statusClassName: Record<PersonStatus, string> = {
  novo: "border-black/20 bg-white text-black",
  responder: "border-yellow-500/40 bg-yellow-100 text-black",
  abordado: "border-orange-700/30 bg-orange-100 text-orange-950",
  respondeu: "border-red-800/20 bg-red-50 text-red-950",
  contato_confirmado: "border-emerald-700/30 bg-emerald-50 text-emerald-950",
  nao_abordar: "border-zinc-500/30 bg-zinc-100 text-zinc-700",
};

export function StatusBadge({ status }: { status: PersonStatus }) {
  return (
    <Badge variant="outline" className={statusClassName[status]}>
      {statusLabels[status]}
    </Badge>
  );
}
