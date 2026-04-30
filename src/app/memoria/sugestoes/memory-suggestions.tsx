/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { suggestStrategicMemoriesAction, createStrategicMemoryAction } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function MemorySuggestions({ initialTopicId }: { initialTopicId?: string }) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await suggestStrategicMemoriesAction(initialTopicId ? { topic_id: initialTopicId } : undefined);
        setSuggestions(data);
      } catch (error) {
        toast({ title: "Erro", description: "Falha ao gerar sugestões.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialTopicId, toast]);

  async function handleConvert(suggestion: any) {
    try {
      const result = await createStrategicMemoryAction({
        title: suggestion.suggested_title,
        summary: suggestion.suggested_summary,
        topic_id: suggestion.topic_id,
        status: "draft"
      });

      if (result.ok) {
        toast({ title: "Sucesso", description: "Sugestão convertida em rascunho." });
        router.push(`/memoria/${result.id}`);
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao converter sugestão.", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-muted-foreground">Sintetizando aprendizados dos resultados registrados...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Não há resultados suficientes com aprendizados registrados para gerar sugestões automáticas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-indigo-600 mb-4">
        <Sparkles className="h-5 w-5" />
        <h3 className="font-bold">Sugestões baseadas em {suggestions.reduce((acc, s) => acc + s.source_count, 0)} resultados</h3>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {suggestions.map((s, idx) => (
          <Card key={idx} className="border-indigo-100 bg-indigo-50/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                  {s.topic_name}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-bold">
                  {s.source_count} resultados analisados
                </span>
              </div>
              <CardTitle className="text-lg mt-2">{s.suggested_title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap mb-4 italic">
                {s.suggested_summary}
              </p>
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => handleConvert(s)}>
                <Plus className="h-4 w-4 mr-2" /> Transformar em Memória (Rascunho)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
