"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AnnouncementStatus = 'nao_iniciado' | 'preparado' | 'enviado' | 'respondeu' | 'revisar_depois';

interface AnnouncementStatusBadgeProps {
  status?: AnnouncementStatus;
  className?: string;
  size?: "sm" | "default";
}

export function AnnouncementStatusBadge({ status = "nao_iniciado", className, size = "default" }: AnnouncementStatusBadgeProps) {
  const configs: Record<AnnouncementStatus, { label: string; color: string }> = {
    nao_iniciado: {
      label: "Não iniciado",
      color: "border-[#d8c7ac] bg-[rgba(17,32,42,0.05)] text-[#11202a] hover:bg-[rgba(17,32,42,0.05)]",
    },
    preparado: {
      label: "Preparado",
      color: "border-[#d3b98f] bg-[#f7f0e4] text-[#8f6e2e] hover:bg-[#f7f0e4]",
    },
    enviado: {
      label: "Enviado",
      color: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50",
    },
    respondeu: {
      label: "Respondeu",
      color: "border-[#a2bba8] bg-[#ecf2ed] text-[#3d5a45] hover:bg-[#ecf2ed]",
    },
    revisar_depois: {
      label: "Revisar depois",
      color: "border-[#e2a8a8] bg-[#fdf2f2] text-[#9e2a2b] hover:bg-[#fdf2f2]",
    },
  };

  const { label, color } = configs[status] || configs.nao_iniciado;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full uppercase font-black tracking-widest transition-all",
        size === "sm" ? "text-[8px] px-1.5 py-0" : "text-[9px] px-2 py-0.5",
        color,
        className
      )}
    >
      {label}
    </Badge>
  );
}
