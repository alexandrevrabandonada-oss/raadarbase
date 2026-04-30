"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";
import { createMobilizationReportAction } from "../actions";
import type { TopicCategoryRow } from "@/lib/data/topics";

export function NewReportForm({ topics: _ }: { topics: TopicCategoryRow[] }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createMobilizationReportAction({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      period_start: formData.get("period_start") as string,
      period_end: formData.get("period_end") as string,
      filters: {
        confirmedOnly: formData.get("confirmedOnly") === "on",
      }
    });

    if (result.ok && result.reportId) {
      router.push(`/relatorios/${result.reportId}`);
    } else {
      setError(!result.ok ? result.error : "Falha na criação.");
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título do Relatório</Label>
            <Input id="title" name="title" placeholder="Ex: Mobilização Mensal - Abril 2026" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição / Contexto</Label>
            <Textarea id="description" name="description" placeholder="Descreva o objetivo deste relatório..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="period_start">Início do Período</Label>
              <Input id="period_start" name="period_start" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">Fim do Período</Label>
              <Input id="period_end" name="period_end" type="date" required />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="confirmedOnly" 
              name="confirmedOnly" 
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="confirmedOnly">Usar apenas temas confirmados por operador</Label>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-900">
              <strong>Aviso de Governança:</strong> Relatórios descrevem pautas públicas e 
              interações registradas através da escuta. 
              <strong> Não representam o perfil político ou ideológico das pessoas.</strong>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando rascunho...
              </>
            ) : (
              "Criar Rascunho"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
