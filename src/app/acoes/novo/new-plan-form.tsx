"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createActionPlanAction, suggestActionPlanFromReportAction, createActionPlanItemAction } from "../actions";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewPlanFormProps {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  topics: any[];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  reports: any[];
  initialReportId?: string;
}

export function NewPlanForm({ topics, reports, initialReportId }: NewPlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [reportId, setReportId] = useState(initialReportId || "");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [suggestions, setSuggestions] = useState<any[] | null>(null);

  const handleSuggest = async () => {
    if (!reportId || reportId === "none") return;
    
    setSuggesting(true);
    try {
      const data = await suggestActionPlanFromReportAction(reportId);
      setTitle(`Plano: ${data.reportTitle}`);
      setTopicId(data.suggestedTopicId || "");
      setSuggestions(data.items);
      toast({
        title: "Sugestões geradas!",
        description: "O plano foi pré-preenchido e itens foram sugeridos."
      });
    } catch {
      toast({
        title: "Falha ao sugerir",
        description: "Não foi possível gerar sugestões a partir deste relatório.",
        variant: "destructive"
      });
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createActionPlanAction({
        title,
        description,
        topic_id: topicId || null,
        source_report_id: reportId && reportId !== "none" ? reportId : null,
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        priority: priority as any,
        due_date: dueDate || null,
        status: "active"
      });

      if (!result.ok) {
        toast({
          title: "Erro de Validação",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      // Criar itens sugeridos se existirem
      if (suggestions && suggestions.length > 0 && result.id) {
        for (const item of suggestions) {
          await createActionPlanItemAction({
            action_plan_id: result.id,
            type: item.type,
            title: item.title,
            description: item.description,
            status: "todo"
          });
        }
      }
      
      router.push("/acoes");
      toast({
        title: "Sucesso!",
        description: "Plano de ação criado com sucesso."
      });
    } catch {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Dados Básicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="report">Relatório de Origem (Opcional)</Label>
            <div className="flex gap-2">
              <Select value={reportId} onValueChange={(value) => setReportId(value ?? "") }>
                <SelectTrigger id="report" className="flex-1">
                  <SelectValue placeholder="Selecione um relatório gerado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {reports.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSuggest} 
                disabled={!reportId || reportId === "none" || suggesting}
              >
                {suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Sugerir
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Título do Plano</Label>
            <Input 
              id="title" 
              placeholder="Ex: Resposta à pauta de saúde Vila Rica" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição / Contexto</Label>
            <Textarea 
              id="description" 
              placeholder="Objetivos gerais e motivação coletiva do plano." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Tema Principal</Label>
              <Select value={topicId} onValueChange={(value) => setTopicId(value ?? "") }>
                <SelectTrigger id="topic">
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value ?? "medium") }>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="due_date">Prazo Estimado</Label>
            <Input 
              id="due_date" 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {suggestions && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="text-sm font-bold flex items-center mb-2">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Sugestões geradas
              </h4>
              <ul className="text-xs space-y-2">
                {suggestions.map((s, idx) => (
                  <li key={idx} className="flex flex-col">
                    <span className="font-semibold text-primary uppercase text-[10px] tracking-wider">{s.type.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">{s.title}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                * Os itens serão criados automaticamente ao salvar o plano.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Plano de Ação"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
