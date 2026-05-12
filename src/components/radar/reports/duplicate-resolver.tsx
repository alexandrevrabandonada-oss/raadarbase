"use client";

import * as React from "react";
import { 
  Archive, 
  AlertCircle, 
  ArrowRightLeft,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveDuplicateAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { DuplicateGroup } from "@/lib/data/data-quality";
import { cn } from "@/lib/utils";

export function DuplicateResolver({ groups }: { groups: DuplicateGroup[] }) {
  const [activeGroupIdx, setActiveGroupIdx] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const currentGroup = groups[activeGroupIdx];

  const handleResolve = (action: "archive" | "keep_separate") => {
    if (!currentGroup) return;
    
    startTransition(async () => {
      const result = await resolveDuplicateAction(
        currentGroup.original.id, 
        currentGroup.duplicates[0].id, 
        action
      );

      if (result.ok) {
        toast({ title: "Resolvido", description: result.message });
        if (activeGroupIdx < groups.length - 1) {
          setActiveGroupIdx(prev => prev + 1);
        } else {
          // No more groups
          toast({ title: "Tudo limpo!", description: "Você revisou todas as duplicatas." });
        }
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  if (!currentGroup) return null;

  return (
    <Card className="border-none shadow-xl ring-1 ring-zinc-200 overflow-hidden bg-white">
      <CardHeader className="bg-rose-50/50 border-b border-rose-100 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 rounded-lg text-white shadow-md">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-rose-900 uppercase">
                Comparar Duplicatas
              </CardTitle>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                Grupo {activeGroupIdx + 1} de {groups.length}
              </p>
            </div>
          </div>
          <Badge className="bg-rose-100 text-rose-700 border-rose-200">
            {currentGroup.reason}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
            <div className="h-10 w-10 rounded-full bg-white border-2 border-zinc-100 flex items-center justify-center text-zinc-300 font-black italic">VS</div>
          </div>

          {/* Original Profile */}
          <div className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/20 relative">
            <Badge className="absolute -top-3 left-4 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-tighter">PERFIL PRINCIPAL (SUGERIDO)</Badge>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-xl font-black text-zinc-900">@{currentGroup.original.username}</span>
                <span className="text-sm font-bold text-zinc-500">{currentGroup.original.displayName || "Sem nome"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white border border-emerald-50">
                  <p className="text-[9px] font-black uppercase text-zinc-400">Interações</p>
                  <p className="text-lg font-black text-emerald-600">{currentGroup.original.totalInteractions}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-50">
                  <p className="text-[9px] font-black uppercase text-zinc-400">Status</p>
                  <p className="text-xs font-black uppercase text-zinc-600">{currentGroup.original.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Duplicate Profile */}
          <div className="p-6 rounded-2xl border-2 border-rose-100 bg-rose-50/20 relative">
            <Badge className="absolute -top-3 left-4 bg-rose-600 text-white font-black text-[9px] uppercase tracking-tighter">POSSÍVEL DUPLICATA</Badge>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-xl font-black text-zinc-900">@{currentGroup.duplicates[0].username}</span>
                <span className="text-sm font-bold text-zinc-500">{currentGroup.duplicates[0].displayName || "Sem nome"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white border border-rose-50">
                  <p className="text-[9px] font-black uppercase text-zinc-400">Interações</p>
                  <p className="text-lg font-black text-rose-600">{currentGroup.duplicates[0].totalInteractions}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-rose-50">
                  <p className="text-[9px] font-black uppercase text-zinc-400">Status</p>
                  <p className="text-xs font-black uppercase text-zinc-600">{currentGroup.duplicates[0].status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <AlertCircle className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest leading-none">O histórico de interações será preservado em ambos.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none font-black uppercase text-[10px] tracking-widest h-11 border-zinc-200"
              onClick={() => handleResolve("keep_separate")}
              disabled={isPending}
            >
              Manter Separados
            </Button>
            <Button 
              className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest h-11 shadow-lg shadow-rose-200"
              onClick={() => handleResolve("archive")}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
              Arquivar Duplicata
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
