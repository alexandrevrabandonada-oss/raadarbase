import { AlertCircle, Clock, ShieldAlert, Milestone, ShieldX, Ghost, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertType = 
  | "sem_responsavel" 
  | "contato_recente" 
  | "nao_abordar" 
  | "precisa_encaminhar" 
  | "webhook_quarentena" 
  | "templates_ausentes"
  | string;

export function OperationalAlert({ 
  type, 
  message, 
  children,
  className 
}: { 
  type: AlertType, 
  message?: string, 
  children?: React.ReactNode,
  className?: string 
}) {
  const config = () => {
    switch (type) {
      case "nao_abordar":
        return {
          icon: ShieldAlert,
          colorClass: "text-rose-700 bg-rose-50 border-rose-200",
          defaultMessage: "Não Abordar: Bloqueado por escolha do contato."
        };
      case "contato_recente":
        return {
          icon: Clock,
          colorClass: "text-amber-700 bg-amber-50 border-amber-200",
          defaultMessage: "Contato recente: Aguarde antes de insistir."
        };
      case "sem_responsavel":
        return {
          icon: Ghost,
          colorClass: "text-zinc-600 bg-zinc-50 border-zinc-200",
          defaultMessage: "Sem dono: Ninguém assumiu esta pessoa ainda."
        };
      case "precisa_encaminhar":
        return {
          icon: Milestone,
          colorClass: "text-indigo-700 bg-indigo-50 border-indigo-200",
          defaultMessage: "Encaminhar: Respondeu e aguarda direcionamento."
        };
      case "webhook_quarentena":
        return {
          icon: ShieldX,
          colorClass: "text-red-700 bg-red-50 border-red-200",
          defaultMessage: "Falha Crítica: Webhooks do Instagram pararam."
        };
      case "templates_ausentes":
        return {
          icon: FileWarning,
          colorClass: "text-orange-700 bg-orange-50 border-orange-200",
          defaultMessage: "Configuração pendente: Nenhum template de mensagem ativo."
        };
      default:
        return {
          icon: AlertCircle,
          colorClass: "text-blue-700 bg-blue-50 border-blue-200",
          defaultMessage: message || "Aviso operacional."
        };
    }
  };

  const { icon: Icon, colorClass, defaultMessage } = config();

  return (
    <div className={cn("flex items-start gap-3 text-xs p-3 rounded-lg border", colorClass, className)}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="font-medium leading-tight flex-1">
        {children || message || defaultMessage}
      </div>
    </div>
  );
}
