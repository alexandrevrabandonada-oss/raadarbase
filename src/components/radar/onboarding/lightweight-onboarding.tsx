"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, ChevronRight, HelpCircle, LayoutDashboard, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingHighlight {
  title: string;
  description: string;
  icon?: React.ElementType;
}

interface LightweightOnboardingProps {
  screenId: string;
  title: string;
  highlights: OnboardingHighlight[];
  onComplete?: () => void;
  className?: string;
}

export function LightweightOnboarding({
  screenId,
  title,
  highlights,
  onComplete,
  className
}: LightweightOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
      const hasSeen = localStorage.getItem(`onboarding_seen_${screenId}`);
      if (!hasSeen) {
        setIsVisible(true);
      }
    }, 0);
  }, [screenId]);

  const handleComplete = () => {
    localStorage.setItem(`onboarding_seen_${screenId}`, "true");
    setIsVisible(false);
    onComplete?.();
  };

  const handleReset = () => {
    localStorage.removeItem(`onboarding_seen_${screenId}`);
    setIsVisible(true);
    setCurrentStep(0);
  };

  if (!isMounted) return null;

  if (!isVisible) {
    return (
      <div className="flex justify-end mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset}
          className="text-[10px] font-black uppercase text-zinc-400 hover:text-indigo-600 h-6 px-2 gap-1.5 transition-colors"
        >
          <HelpCircle className="h-3 w-3" /> Ver tour de novo
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("border-indigo-600 bg-indigo-600 text-white shadow-2xl shadow-indigo-200/50 overflow-hidden mb-8 animate-in fade-in zoom-in-95 duration-300", className)}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Progress Sidebar (Desktop) */}
          <div className="hidden md:flex flex-col gap-1 p-6 bg-indigo-700/50 w-64 border-r border-indigo-500/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-4">Tour de Orientação</h3>
            {highlights.map((h, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-all duration-300",
                  currentStep === i ? "bg-white text-indigo-900 shadow-md scale-[1.02]" : "text-indigo-100 opacity-40"
                )}
              >
                <div className="text-[10px] font-black">0{i + 1}</div>
                <div className="text-[10px] font-bold truncate">{h.title}</div>
              </div>
            ))}
            
            <div className="mt-auto pt-6 border-t border-indigo-500/30">
              <p className="text-[9px] font-black uppercase tracking-tighter text-indigo-300/60 leading-tight">
                ⚠️ CONTATO MANUAL<br/>
                PROIBIDO PEDIDO DE VOTO
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 md:p-8 space-y-6 relative">
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Conhecendo a Ferramenta</p>
                <h2 className="text-2xl font-black tracking-tight">{title}</h2>
              </div>

              <div key={currentStep} className="flex flex-col sm:flex-row items-start gap-6 bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                {highlights[currentStep].icon && (
                  <div className="h-12 w-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-xl">
                    {(() => {
                      const Icon = highlights[currentStep].icon;
                      return Icon ? <Icon className="h-6 w-6" /> : null;
                    })()}
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-lg font-black leading-tight">{highlights[currentStep].title}</h4>
                  <p className="text-sm text-indigo-50 font-medium leading-relaxed">
                    {highlights[currentStep].description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="flex gap-1.5">
                {highlights.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentStep === i ? "w-10 bg-white" : "w-2 bg-white/20"
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsVisible(false)}
                  className="text-indigo-200 hover:text-white hover:bg-white/10 font-bold text-xs"
                >
                  Pular
                </Button>
                {currentStep < highlights.length - 1 ? (
                  <Button 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex-1 sm:flex-none bg-white text-indigo-600 hover:bg-indigo-50 font-black px-8 shadow-lg transition-transform hover:scale-105"
                  >
                    Próximo <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleComplete}
                    className="flex-1 sm:flex-none bg-white text-indigo-600 hover:bg-indigo-50 font-black px-8 shadow-lg transition-transform hover:scale-105"
                  >
                    Entendi, vamos lá! <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
