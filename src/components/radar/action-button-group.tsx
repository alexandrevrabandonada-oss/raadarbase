import { ReactNode } from "react";
import Link from "next/link";
import { Copy, Instagram, MessageSquare, UserPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ActionButtonGroupProps {
  personId?: string;
  instagramUsername?: string;
  onAssume?: () => void;
  onCopyDM?: () => void;
  onRegisterResponse?: () => void;
  isAssuming?: boolean;
  canAssume?: boolean;
  canCopyDM?: boolean;
  canRegisterResponse?: boolean;
  className?: string;
}

export function ActionButtonGroup({
  personId,
  instagramUsername,
  onAssume,
  onCopyDM,
  onRegisterResponse,
  isAssuming,
  canAssume,
  canCopyDM,
  canRegisterResponse,
  className
}: ActionButtonGroupProps) {
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      
      {/* 1. Assumir Responsabilidade */}
      {canAssume && onAssume && (
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
          onClick={onAssume}
          disabled={isAssuming}
        >
          <UserPlus className="h-3 w-3 mr-1.5" />
          Assumir
        </Button>
      )}

      {/* 2. Abrir Instagram */}
      {instagramUsername && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-pink-600 p-0" onClick={() => window.open(`https://instagram.com/${instagramUsername}`, '_blank')}>
                <Instagram className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir Instagram</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 3. Copiar DM */}
      {canCopyDM && onCopyDM && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-indigo-600 p-0" onClick={onCopyDM}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar template de DM</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 4. Registrar Resposta */}
      {canRegisterResponse && onRegisterResponse && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-emerald-600 p-0" onClick={onRegisterResponse}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Registrar resposta</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 5. Ver Ficha (Primary Action) */}
      {personId && (
        <Button size="sm" className="h-8 text-xs font-bold px-3 p-0 ml-1">
          <Link href={`/pessoas/${personId}`} className="w-full h-full flex items-center justify-center px-3">
            Ver ficha
          </Link>
        </Button>
      )}
    </div>
  );
}
