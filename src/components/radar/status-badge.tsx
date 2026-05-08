"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RadarStatus = 
  | "novo"
  | "primeiro_contato"
  | "mensagem_enviada"
  | "aguardando_retorno"
  | "respondeu"
  | "precisa_encaminhar"
  | "entrou_na_base"
  | "nao_abordar"
  | string;

interface StatusBadgeProps {
  status: RadarStatus;
  className?: string;
  size?: "sm" | "default";
}

export function getStatusConfig(status: string) {
  const s = status.toLowerCase();
  
  if (s.includes("novo") || s === "para_abordar" || s === "novo") 
    return { label: "Novo", color: "bg-zinc-100 text-zinc-700 border-zinc-200" };
  
  if (s.includes("primeiro contato") || s === "responder" || s === "responder_comentario" || s === "primeiro_contato") 
    return { label: "1º Contato", color: "bg-blue-50 text-blue-700 border-blue-200" };
    
  if (s.includes("enviada") || s === "abordado" || s === "mandar_dm_manual" || s === "mensagem_enviada") 
    return { label: "DM Enviada", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    
  if (s.includes("aguardando") || s.includes("esperando") || s === "aguardando_retorno") 
    return { label: "Esperando", color: "bg-amber-50 text-amber-700 border-amber-200" };
    
  if (s === "respondeu") 
    return { label: "Respondeu", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    
  if (s.includes("encaminhar") || s.includes("convidar") || s === "precisa_encaminhar") 
    return { label: "Encaminhar", color: "bg-orange-50 text-orange-700 border-orange-200" };
    
  if (s.includes("base") || s === "contato_confirmado" || s === "convidado" || s === "entrou_na_base") 
    return { label: "Na Base", color: "bg-emerald-500 text-white border-emerald-600 font-black shadow-sm" };
    
  if (s.includes("não abordar") || s.includes("nao_abordar") || s.includes("nao_insistir")) 
    return { label: "Não Abordar", color: "bg-rose-50 text-rose-700 border-rose-200 line-through opacity-80" };

  return { label: status.replace(/_/g, " "), color: "bg-zinc-50 text-zinc-600 border-zinc-200" };
}

export function RadarStatusBadge({ status, className, size = "default" }: StatusBadgeProps) {
  const { label, color } = getStatusConfig(status);
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "uppercase font-black tracking-widest transition-all",
        size === "sm" ? "text-[8px] px-1.5 py-0" : "text-[9px] px-2 py-0.5",
        color,
        className
      )}
    >
      {label}
    </Badge>
  );
}
