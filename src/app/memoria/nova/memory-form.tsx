/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { createStrategicMemoryAction } from "../actions";
import { useToast } from "@/hooks/use-toast";

export function MemoryForm({ topics }: { topics: any[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      summary: formData.get("summary") as string,
      topic_id: formData.get("topic_id") as string || null,
      territory: formData.get("territory") as string || null,
      period_start: formData.get("period_start") as string || null,
      period_end: formData.get("period_end") as string || null,
      status: "active" as const,
    };

    try {
      const result = await createStrategicMemoryAction(data);
      if (result.ok) {
        toast({ title: "Sucesso", description: result.message });
        router.push(`/memoria/${result.id}`);
      } else {
        toast({ 
          title: "Erro de Governança", 
          description: result.error, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Falha ao salvar memória estratégica.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identificação do Aprendizado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Memória</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Padrão de mobilização sobre Saúde no Bairro X"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="topic_id">Tema Relacionado</Label>
              <Select name="topic_id">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tema" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="territory">Território / Bairro</Label>
              <Input
                id="territory"
                name="territory"
                placeholder="Ex: Vila Rica, Santa Cruz..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="period_start">Início do Período</Label>
              <Input id="period_start" name="period_start" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="period_end">Fim do Período</Label>
              <Input id="period_end" name="period_end" type="date" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-100 bg-indigo-50/10">
        <CardHeader>
          <CardTitle className="text-indigo-900">Resumo Estratégico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="summary">O que aprendemos?</Label>
            <Textarea
              id="summary"
              name="summary"
              placeholder="Descreva o padrão identificado, o que funcionou e o que não funcionou."
              className="min-h-[150px]"
              required
            />
            <p className="text-[10px] text-muted-foreground italic">
              Este texto deve focar em aprendizados coletivos. Evite citar nomes ou dados pessoais.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-bold">Aviso de Governança:</p>
          <p className="mt-1">
            Memórias registram aprendizados coletivos e operacionais. 
            <strong> Não use para classificar pessoas, votos ou perfis individuais. </strong>
            O sistema bloqueia termos proibidos e remove PII automaticamente.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Memória Estratégica
        </Button>
      </div>
    </form>
  );
}
