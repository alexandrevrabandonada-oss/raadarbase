import Link from "next/link";
import { Copy, Instagram, MessageSquare, UserPlus, ArrowRight } from "lucide-react";
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
  onReferral?: () => void;
  isAssuming?: boolean;
  canAssume?: boolean;
  canCopyDM?: boolean;
  canRegisterResponse?: boolean;
  canReferral?: boolean;
  className?: string;
}

export function ActionButtonGroup({
  personId,
  instagramUsername,
  onAssume,
  onCopyDM,
  onRegisterResponse,
  onReferral,
  isAssuming,
  canAssume,
  canCopyDM,
  canRegisterResponse,
  canReferral,
  className
}: ActionButtonGroupProps) {
  const brutalIconBtnClass = "h-8 w-8 text-charcoal border-2 border-black rounded-[2px] bg-white hover:bg-burnt-yellow hover:text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)] transition-all p-0 flex items-center justify-center";

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      
      {/* 1. Assumir */}
      {canAssume && onAssume && (
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 text-[10px] font-black uppercase text-charcoal border-2 border-black rounded-[2px] bg-white hover:bg-burnt-yellow hover:text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)] transition-all"
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
            <TooltipTrigger render={<div />}>
              <Button 
                size="icon" 
                variant="outline" 
                className={brutallIconBtnClass(instagramUsername)} 
                onClick={() => {
                  const igUsername = instagramUsername.replace(/^@+/, "");
                  window.open(`https://www.instagram.com/${igUsername}/`, '_blank');
                }}
              >
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
            <TooltipTrigger render={<div />}>
              <Button 
                size="icon" 
                variant="outline" 
                className={brutalIconBtnClass} 
                onClick={onCopyDM}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar DM</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 4. Registrar Resposta */}
      {canRegisterResponse && onRegisterResponse && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Button 
                size="icon" 
                variant="outline" 
                className={brutalIconBtnClass} 
                onClick={onRegisterResponse}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Registrar Resposta</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 5. Encaminhar */}
      {canReferral && onReferral && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<div />}>
              <Button 
                size="icon" 
                variant="outline" 
                className={brutalIconBtnClass} 
                onClick={onReferral}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Encaminhar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 6. Ver Ficha (Primary Action) */}
      {personId && (
        <Button
          size="sm"
          className="ml-1 h-8 px-3 text-[10px] font-black uppercase border-2 border-black rounded-[2px] shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]"
          nativeButton={false}
          render={<Link href={`/pessoas/${personId}`} className="flex items-center justify-center" />}
        >
          Ver ficha
        </Button>
      )}
    </div>
  );
}

// Helper to support call syntax on static string
function brutallIconBtnClass(ig: string) {
  return "h-8 w-8 text-charcoal border-2 border-black rounded-[2px] bg-white hover:bg-burnt-yellow hover:text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)] transition-all p-0 flex items-center justify-center";
}
