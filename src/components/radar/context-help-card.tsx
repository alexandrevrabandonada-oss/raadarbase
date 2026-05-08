"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb, Info, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContextHelpCardProps {
  title: string;
  whatIsThis: string;
  whyItMatters: string;
  whatToDoNow: string;
  primaryAction?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function ContextHelpCard({
  title,
  whatIsThis,
  whyItMatters,
  whatToDoNow,
  primaryAction,
  collapsible = true,
  defaultOpen = false, // Começar fechado para não ocupar espaço no início, a menos que solicitado
  className
}: ContextHelpCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn("border-indigo-100 bg-indigo-50/30 overflow-hidden shadow-sm", className)}>
      <div 
        className={cn(
          "px-4 py-3 flex items-center justify-between cursor-pointer select-none",
          collapsible ? "hover:bg-indigo-50/50" : "cursor-default"
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">{title}</h4>
        </div>
        {collapsible && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {isOpen && (
        <CardContent className="px-4 pb-4 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-indigo-100/50">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                <Info className="h-3 w-3" /> O que é esta tela
              </div>
              <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                {whatIsThis}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                <Lightbulb className="h-3 w-3" /> Por que importa
              </div>
              <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                {whyItMatters}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                <ArrowRight className="h-3 w-3" /> O que fazer agora
              </div>
              <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                {whatToDoNow}
              </p>
            </div>
          </div>

          {primaryAction && (
            <div className="pt-2 flex justify-end">
              {primaryAction}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
