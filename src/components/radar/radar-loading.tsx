"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarLoadingProps {
  message?: string;
  className?: string;
}

export function RadarLoading({ message = "Carregando inteligência...", className }: RadarLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] w-full gap-4", className)}>
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-zinc-100 border-t-indigo-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-indigo-400 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-zinc-900 animate-pulse">{message}</p>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Preparando dados operacionais para você</p>
      </div>
    </div>
  );
}

export function RadarSkeletonList() {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 w-full bg-zinc-50 rounded-xl border border-zinc-100 animate-pulse flex items-center px-4 gap-4">
           <div className="h-10 w-10 rounded-full bg-zinc-100" />
           <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-zinc-100 rounded" />
              <div className="h-2 w-48 bg-zinc-100 rounded" />
           </div>
           <div className="h-8 w-24 bg-zinc-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
