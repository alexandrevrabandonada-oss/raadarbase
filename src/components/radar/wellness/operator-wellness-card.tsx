"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Heart, Lightbulb, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { WellnessCheck } from "@/lib/data/operator-wellness";

interface OperatorWellnessCardProps {
  wellness: WellnessCheck;
  className?: string;
}

export function OperatorWellnessCard({ wellness, className }: OperatorWellnessCardProps) {
  if (wellness.level === "healthy") {
    return null;
  }

  return (
    <Card
      className={cn(
        "border-none shadow-lg",
        wellness.level === "warning"
          ? "bg-amber-50 border-amber-100"
          : "bg-rose-50 border-rose-100",
        className
      )}
    >
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {wellness.level === "warning" ? (
              <Lightbulb className="h-5 w-5 text-amber-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            )}
          </div>

          <div className="flex-1">
            <h3 className={cn(
              "font-black text-sm uppercase tracking-widest mb-2",
              wellness.level === "warning" ? "text-amber-900" : "text-rose-900"
            )}>
              {wellness.level === "warning" ? "⚠️ Dica" : "🚨 Atenção ao Bem-Estar"}
            </h3>

            <p className={cn(
              "text-sm leading-relaxed mb-3",
              wellness.level === "warning" ? "text-amber-800" : "text-rose-800"
            )}>
              {wellness.recommendation}
            </p>

            <div className={cn(
              "p-3 rounded-lg bg-white/40 border text-xs font-medium italic",
              wellness.level === "warning"
                ? "border-amber-200 text-amber-900"
                : "border-rose-200 text-rose-900"
            )}>
              &quot;{wellness.microcopy}&quot;
            </div>

            {wellness.shouldSuggestBreak && (
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-700 uppercase">
                <Coffee className="h-4 w-4" />
                Considere uma pausa após concluir alguns contatos.
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center justify-center">
            <Heart className="h-6 w-6 text-rose-400 fill-rose-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
