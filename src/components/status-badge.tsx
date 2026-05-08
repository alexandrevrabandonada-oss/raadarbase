import { RadarStatusBadge } from "./radar/status-badge";
import type { PersonStatus, KanbanColumnId } from "@/lib/types";

export function StatusBadge({ status, className }: { status: PersonStatus | KanbanColumnId | string, className?: string }) {
  return <RadarStatusBadge status={status} className={className} />;
}

