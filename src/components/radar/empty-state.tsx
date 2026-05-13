import { ReactNode } from "react";
import { FolderSearch, LayoutGrid, Settings2, ShieldCheck, LucideIcon } from "lucide-react";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";

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
          defaultDescription: "Não encontramos nada com estes critérios. Revise filtros, amplie a busca ou volte para a leitura geral."
        };
      case "needs_config":
        return {
          DefaultIcon: Settings2,
          defaultDescription: "Esta frente ainda depende de configuração. Revise integrações, modelos ou parâmetros antes de abrir a operação."
        };
      case "success":
        return {
          DefaultIcon: ShieldCheck,
          defaultDescription: "Tudo certo por aqui. O ciclo foi fechado e não há nova ação imediata."
        };
      case "no_data":
      default:
        return {
          DefaultIcon: LayoutGrid,
          defaultDescription: "Ainda não há dados aqui. Isso pode acontecer porque o ciclo está começando ou porque a próxima missão ainda não foi preparada."
        };
    }
  };

  const { DefaultIcon, defaultDescription } = getDefaults();
  const RenderIcon = icon || DefaultIcon;

  return (
    <GamefulEmptyState
      title={title}
      description={description || defaultDescription}
      icon={RenderIcon}
      className={className}
      variant={type === "success" ? "ethics" : type === "needs_config" ? "rhythm" : type === "empty_filter" ? "journey" : "base"}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      compact={false}
    />
  );
}
