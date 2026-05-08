import { ReactNode } from "react";
import { FolderSearch, LayoutGrid, Settings2, ShieldCheck, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateType = "no_data" | "empty_filter" | "needs_config" | "success" | string;

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description: string;
  icon?: LucideIcon;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  type = "no_data", 
  title, 
  description, 
  icon, 
  primaryAction, 
  secondaryAction, 
  className 
}: EmptyStateProps) {
  
  const getDefaults = () => {
    switch (type) {
      case "empty_filter":
        return {
          DefaultIcon: FolderSearch,
          iconColor: "text-zinc-400",
          bgColor: "bg-zinc-100",
          borderColor: "border-zinc-200",
          defaultDescription: "Não encontramos ninguém com estes critérios. Tente limpar os filtros ou buscar por outro termo."
        };
      case "needs_config":
        return {
          DefaultIcon: Settings2,
          iconColor: "text-amber-500",
          bgColor: "bg-amber-100",
          borderColor: "border-amber-200",
          defaultDescription: "Esta funcionalidade precisa de configuração. Verifique as conexões ou modelos necessários para começar."
        };
      case "success":
        return {
          DefaultIcon: ShieldCheck,
          iconColor: "text-emerald-500",
          bgColor: "bg-emerald-100",
          borderColor: "border-emerald-200",
          defaultDescription: "Tudo certo por aqui! O fluxo foi concluído com sucesso."
        };
      case "no_data":
      default:
        return {
          DefaultIcon: LayoutGrid,
          iconColor: "text-zinc-400",
          bgColor: "bg-zinc-100",
          borderColor: "border-zinc-200",
          defaultDescription: "Ainda não há dados aqui. Isso pode ser porque o piloto está começando ou porque você precisa assumir tarefas."
        };
    }
  };

  const { DefaultIcon, iconColor, bgColor, borderColor, defaultDescription } = getDefaults();
  const RenderIcon = icon || DefaultIcon;

  return (
    <Card className={cn("border-dashed py-16 flex flex-col items-center justify-center text-center bg-zinc-50/50", borderColor, className)}>
      <div className={cn("h-16 w-16 rounded-full flex items-center justify-center mb-6 shadow-sm border", bgColor, borderColor)}>
        <RenderIcon className={cn("h-8 w-8", iconColor)} />
      </div>
      <h3 className="font-black text-xl mb-2 text-zinc-900">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
        {description || defaultDescription}
      </p>
      
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </Card>
  );
}
