"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Coffee, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BreakSuggestionProps {
  tasksCompleted: number;
  className?: string;
  onDismiss?: () => void;
  onTakeBrea?: () => void;
}

export function BreakSuggestion({ tasksCompleted, className, onDismiss, onTakeBrea }: BreakSuggestionProps) {
  return (
    <Card className={cn("border-2 border-rose-200 bg-rose-50 shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <Coffee className="h-5 w-5 text-rose-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight text-rose-900 leading-none mb-1">
                Pausa Bem-Vinda
              </h3>
              <p className="text-sm font-medium text-rose-800 leading-relaxed">
                Você completou <strong>{tasksCompleted} pessoas</strong> hoje. Você já fez um excelente trabalho. Uma pausa agora vai melhorar sua qualidade daqui para frente.
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-lg opacity-40 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 border border-rose-200 mb-4">
          <Heart className="h-4 w-4 text-rose-400 fill-rose-400 flex-shrink-0" />
          <p className="text-xs font-medium text-rose-900 italic">
            &quot;Cuidado com si mesmo é cuidado com a base.&quot;
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTakeBrea}
            className="flex-1 border-rose-200 text-rose-900 hover:bg-rose-100"
          >
            <Coffee className="h-4 w-4 mr-2" />
            Vou pausar
          </Button>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="flex-1 text-rose-600 hover:text-rose-900 hover:bg-rose-100"
            >
              Vou continuar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
