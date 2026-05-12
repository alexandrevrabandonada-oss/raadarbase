"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRandomMicrocopy } from "@/lib/data/operator-wellness";

interface DailyWellnessTipProps {
  className?: string;
  microcopy?: string;
}

export function DailyWellnessTip({ className, microcopy }: DailyWellnessTipProps) {
  const message = microcopy || getRandomMicrocopy();

  return (
    <Card className={cn("border-amber-100 bg-amber-50/50", className)}>
      <CardContent className="p-4 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-medium text-amber-900 italic leading-relaxed">
          &quot;{message}&quot;
        </p>
      </CardContent>
    </Card>
  );
}
