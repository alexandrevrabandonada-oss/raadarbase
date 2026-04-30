"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Plus,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { updateActionPlanItemAction } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface KanbanBoardProps {
  planId: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  initialItems: any[];
}

const COLUMNS = [
  { id: "todo", title: "A fazer", icon: Circle },
  { id: "doing", title: "Em andamento", icon: Clock },
  { id: "blocked", title: "Bloqueado", icon: AlertCircle },
  { id: "done", title: "Concluído", icon: CheckCircle2 },
];

export function KanbanBoard({ planId, initialItems }: KanbanBoardProps) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [updating, setUpdating] = useState<string | null>(null);

  const moveItem = async (itemId: string, newStatus: string) => {
    setUpdating(itemId);
    try {
      const result = await updateActionPlanItemAction(itemId, planId, { 
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        status: newStatus as any,
        completed_at: newStatus === "done" ? new Date().toISOString() : null
      });

      if (result.ok) {
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        ));
        toast({ title: "Status atualizado" });
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const getItemsByStatus = (status: string) => items.filter(i => i.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
      {COLUMNS.map((col) => {
        const colItems = getItemsByStatus(col.id);
        const Icon = col.icon;

        return (
          <div key={col.id} className="flex flex-col h-full bg-muted/30 rounded-xl border p-4 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${col.id === 'done' ? 'text-green-600' : col.id === 'blocked' ? 'text-destructive' : 'text-muted-foreground'}`} />
                <h3 className="font-bold text-sm uppercase tracking-wider">{col.title}</h3>
                <Badge variant="secondary" className="ml-2 bg-white/50">{colItems.length}</Badge>
              </div>
              {col.id === 'todo' && (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {colItems.map((item) => (
                <Card key={item.id} className={`shadow-sm border-l-4 ${updating === item.id ? 'opacity-50' : ''} ${
                  item.type === 'post_publico' ? 'border-l-blue-400' : 
                  item.type === 'escuta_bairro' ? 'border-l-amber-400' :
                  item.type === 'encaminhamento' ? 'border-l-purple-400' : 'border-l-muted-foreground'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">
                          {item.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-sm font-semibold leading-tight">
                          <Link href={`/acoes/${planId}/itens/${item.id}`} className="hover:underline">
                            {item.title}
                          </Link>
                        </h4>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" className="h-6 w-6 -mr-1" />}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/acoes/${planId}/itens/${item.id}`} />}>
                            Detalhes e Execução
                          </DropdownMenuItem>
                          {COLUMNS.filter(c => c.id !== item.status).map(c => (
                            <DropdownMenuItem key={c.id} onClick={() => moveItem(item.id, c.id)}>
                              Mover para {c.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {item.action_item_evidence?.length > 0 && (
                        <Badge variant="outline" className="text-[9px] px-1 h-4 bg-blue-50 text-blue-700 border-blue-200">
                          {item.action_item_evidence.length} evid.
                        </Badge>
                      )}
                      {item.action_item_results && (
                        <Badge variant="outline" className="text-[9px] px-1 h-4 bg-green-50 text-green-700 border-green-200">
                          Result. OK
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex -space-x-1">
                        <div className="h-5 w-5 rounded-full bg-primary/10 border border-white flex items-center justify-center text-[8px] font-bold">
                          RB
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          nativeButton={false}
                          render={<Link href={`/acoes/${planId}/itens/${item.id}`} />}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        {item.status !== 'done' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 hover:text-green-600" 
                            onClick={() => moveItem(item.id, 'done')}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {item.status !== 'blocked' && item.status !== 'done' && (
                           <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-6 w-6 hover:text-destructive" 
                           onClick={() => moveItem(item.id, 'blocked')}
                         >
                           <AlertCircle className="h-4 w-4" />
                         </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {colItems.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground">
                  <span className="text-[10px] italic">Vazio</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
