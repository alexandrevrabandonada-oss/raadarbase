"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  Loader2, 
  Edit3, 
  MessageSquare, 
  TrendingUp, 
  FastForward,
} from "lucide-react";
import { upsertActionItemResultAction, completeItemWithResultAction } from "../../execution-actions";
import { useToast } from "@/hooks/use-toast";

interface ExecutionFormsProps {
  planId: string;
  itemId: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  initialResult: any | null;
  itemStatus: string;
}

export function ExecutionForms({ planId, itemId, initialResult, itemStatus }: ExecutionFormsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!initialResult);

  const [summary, setSummary] = useState(initialResult?.result_summary || "");
  const [response, setResponse] = useState(initialResult?.public_response || "");
  const [lessons, setLessons] = useState(initialResult?.lessons_learned || "");
  const [nextStep, setNextStep] = useState(initialResult?.next_step || "");

  const handleSaveResult = async (complete: boolean) => {
    setLoading(true);
    try {
      const payload = {
        action_plan_item_id: itemId,
        result_summary: summary,
        public_response: response || null,
        lessons_learned: lessons || null,
        next_step: nextStep || null
      };

      const result = complete 
        ? await completeItemWithResultAction(planId, itemId, payload)
        : await upsertActionItemResultAction(planId, payload);

      if (result.ok) {
        toast({ title: "Sucesso", description: complete ? "Item concluído com resultado." : "Resultado salvo." });
        setEditing(false);
        // Refresh idealmente via router.refresh() ou server actions
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!editing && initialResult) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-white border rounded-lg space-y-3">
          <div>
            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" /> Resumo do Resultado
            </Label>
            <p className="text-sm">{initialResult.result_summary}</p>
          </div>
          
          {initialResult.lessons_learned && (
            <div>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> Aprendizados
              </Label>
              <p className="text-xs italic">{initialResult.lessons_learned}</p>
            </div>
          )}

          {initialResult.next_step && (
            <div>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center">
                <FastForward className="h-3 w-3 mr-1" /> Próximo Passo
              </Label>
              <p className="text-xs font-semibold">{initialResult.next_step}</p>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing(true)}>
          <Edit3 className="h-4 w-4 mr-2" /> Editar Resultado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <Label htmlFor="summary" className="text-xs font-bold">Resumo do que foi feito *</Label>
          <Textarea 
            id="summary" 
            placeholder="Sintetize a execução e o impacto direto..." 
            className="text-xs"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="response" className="text-xs font-bold">Resposta Pública (Opcional)</Label>
          <Textarea 
            id="response" 
            placeholder="O que foi comunicado à base/comunidade?" 
            className="text-xs"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="lessons" className="text-xs font-bold">Aprendizados (Opcional)</Label>
          <Textarea 
            id="lessons" 
            placeholder="O que aprendemos com esta ação?" 
            className="text-xs italic"
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="nextStep" className="text-xs font-bold">Próximo Passo (Opcional)</Label>
          <Input 
            id="nextStep" 
            placeholder="Qual a continuidade desta pauta?" 
            className="text-xs"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button 
          onClick={() => handleSaveResult(false)} 
          disabled={loading || !summary}
          variant="secondary"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Apenas Resultado"}
        </Button>
        
        {itemStatus !== 'done' && (
          <Button 
            onClick={() => handleSaveResult(true)} 
            disabled={loading || !summary}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar Item com este Resultado
              </>
            )}
          </Button>
        )}
        
        {initialResult && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
