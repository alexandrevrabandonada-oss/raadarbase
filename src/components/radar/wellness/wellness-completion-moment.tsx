"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageSquare, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPLETION_MESSAGES } from "@/lib/data/operator-wellness";

type CompletionType = keyof typeof COMPLETION_MESSAGES;

interface WellnessCompletionMomentProps {
  type: CompletionType;
  className?: string;
  onDismiss?: () => void;
}

export function WellnessCompletionMoment({ type, className, onDismiss }: WellnessCompletionMomentProps) {
  const message = COMPLETION_MESSAGES[type];

  const iconMap = {
    person_responded: MessageSquare,
    person_referred: ArrowRight,
    do_not_contact: Shield,
    many_completed_today: Heart,
  };

  const Icon = iconMap[type];

  const colorMap = {
    person_responded: "bg-indigo-50 border-indigo-100 text-indigo-700",
    person_referred: "bg-emerald-50 border-emerald-100 text-emerald-700",
    do_not_contact: "bg-blue-50 border-blue-100 text-blue-700",
    many_completed_today: "bg-amber-50 border-amber-100 text-amber-700",
  };

  return (
    <Card
      className={cn(
        "border-2 shadow-lg animate-in zoom-in-50 duration-300",
        colorMap[type],
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-black text-sm uppercase tracking-tight leading-none mb-1">
              {message.title}
            </h3>
            <p className="text-sm font-medium opacity-80 leading-relaxed">
              {message.message}
            </p>
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
      </CardContent>
    </Card>
  );
}
