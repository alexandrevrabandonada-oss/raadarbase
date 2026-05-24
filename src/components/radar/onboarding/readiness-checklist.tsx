"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, ShieldCheck, Users, MessageSquare, ClipboardList, Zap, Instagram } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReadinessChecklist() {
  const [items, setItems] = useState([
    { id: "equipe", label: "Equipe com acesso ao Radar", checked: true, icon: Users },
    { id: "tarefas", label: "Tarefas distribuídas na equipe", checked: false, icon: ClipboardList },
    { id: "templates", label: "Templates de mensagem ativos", checked: true, icon: MessageSquare },
    { id: "fila", label: "Minha Fila testada e funcional", checked: false, icon: Zap },
    { id: "ficha", label: "Ficha Rápida operando", checked: true, icon: ShieldCheck },
    { id: "instagram", label: "Link de abrir Instagram ativo", checked: true, icon: Instagram },
    { id: "fechamento", label: "Fluxo de fechamento diário configurado", checked: false, icon: CheckCircle2 },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const completedCount = items.filter(i => i.checked).length;
  const isAllDone = completedCount === items.length;

  return (
    <Card className={cn(
      "border-none shadow-sm transition-all",
      isAllDone ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-white ring-1 ring-zinc-100"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
           <div>
             <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-800">Checklist Final de Abertura</CardTitle>
             <CardDescription className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-tight">Verifique se o Radar está pronto para o GO.</CardDescription>
           </div>
           <div className="h-10 w-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center font-black text-xs text-zinc-500">
             {completedCount}/{items.length}
           </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => toggleItem(item.id)}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
              item.checked ? "bg-white border-emerald-100 shadow-sm" : "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                item.checked ? "bg-emerald-100 text-emerald-600" : "bg-zinc-200 text-zinc-400 group-hover:bg-zinc-300"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className={cn(
                "text-xs font-bold transition-colors",
                item.checked ? "text-zinc-900" : "text-zinc-500"
              )}>{item.label}</span>
            </div>
            {item.checked ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50" />
            ) : (
              <Circle className="h-5 w-5 text-zinc-300" />
            )}
          </div>
        ))}

        {isAllDone && (
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs h-12">
               Declarar Piloto Aberto <Zap className="ml-2 h-4 w-4 fill-current" />
             </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
