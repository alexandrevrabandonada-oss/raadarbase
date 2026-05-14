"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStrategicMemoryAction, createStrategicMemoryFromFieldResultAction } from "../actions";
import { useToast } from "@/hooks/use-toast";
import type { TopicCategoryRow } from "@/lib/data/topics";
import {
  ASSISTED_FIELD_MEMORY_TYPES,
  buildAssistedMemorySummary,
  detectObviousSensitiveMemoryContent,
  hasCompletedAssistedMemoryChecklist,
  type AssistedFieldMemoryDraft,
  type AssistedMemoryChecklistState,
} from "@/lib/field-memory/assisted-memory";

const EMPTY_CHECKLIST: AssistedMemoryChecklistState = {
  noCitizenName: false,
  noHandle: false,
  noDirectContact: false,
  noAddress: false,
  noSensitiveData: false,
  noIndividualStoryWithoutConsent: false,
};

function buildChecklistLabel(key: keyof AssistedMemoryChecklistState) {
  switch (key) {
    case "noCitizenName":
      return "Não contém nome de cidadão.";
    case "noHandle":
      return "Não contém @ ou identificador público.";
    case "noDirectContact":
      return "Não contém telefone ou email.";
    case "noAddress":
      return "Não contém endereço ou referência residencial.";
    case "noSensitiveData":
      return "Não contém dado sensível.";
    case "noIndividualStoryWithoutConsent":
      return "Não expõe relato individual sem consentimento.";
  }
}

export function MemoryForm({
  topics,
  assistedDraft,
}: {
  topics: TopicCategoryRow[];
  assistedDraft?: AssistedFieldMemoryDraft | null;
}) {
  const [loading, setLoading] = useState(false);
  const [topicId, setTopicId] = useState<string>(assistedDraft?.topicId ?? "");
  const [memoryType, setMemoryType] = useState<string>(assistedDraft?.memoryType ?? ASSISTED_FIELD_MEMORY_TYPES[0]);
  const [checklist, setChecklist] = useState<AssistedMemoryChecklistState>(EMPTY_CHECKLIST);
  const router = useRouter();
  const { toast } = useToast();

  const assistedSource = assistedDraft
    ? {
        resultId: assistedDraft.sourceEntityId,
        eventId: assistedDraft.eventId,
      }
    : null;

  const checklistComplete = hasCompletedAssistedMemoryChecklist(checklist);

  const explanationPreview = useMemo(
    () =>
      assistedDraft
        ? buildAssistedMemorySummary({
            whatHappened: assistedDraft.whatHappened,
            whatLearned: assistedDraft.whatLearned,
            howToUseNextCycle: assistedDraft.howToUseNextCycle,
            suggestedNextStep: assistedDraft.suggestedNextStep,
          })
        : null,
    [assistedDraft],
  );

  function handleMemoryTypeChange(value: string | null) {
    if (value) {
      setMemoryType(value);
    }
  }

  function handleTopicChange(value: string | null) {
    setTopicId(value ?? "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checklistComplete) {
      toast({
        title: "Checklist pendente",
        description: "Revise os cuidados éticos antes de salvar a memória.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);

    const title = String(formData.get("title") || "").trim();
    const territory = String(formData.get("territory") || "").trim();
    const periodStart = String(formData.get("period_start") || "").trim();
    const periodEnd = String(formData.get("period_end") || "").trim();
    const whatHappened = String(formData.get("what_happened") || "").trim();
    const whatLearned = String(formData.get("what_learned") || "").trim();
    const howToUseNextCycle = String(formData.get("how_to_use_next_cycle") || "").trim();
    const ethicalCare = String(formData.get("ethical_care") || "").trim();
    const suggestedNextStep = String(formData.get("suggested_next_step") || "").trim();

    const sensitiveIssues = [
      ...detectObviousSensitiveMemoryContent(title),
      ...detectObviousSensitiveMemoryContent(whatHappened),
      ...detectObviousSensitiveMemoryContent(whatLearned),
      ...detectObviousSensitiveMemoryContent(howToUseNextCycle),
      ...detectObviousSensitiveMemoryContent(ethicalCare),
      ...detectObviousSensitiveMemoryContent(suggestedNextStep),
    ];

    if (sensitiveIssues.length > 0) {
      toast({
        title: "Revisão ética necessária",
        description: "Remova @, contatos diretos ou referências de endereço antes de salvar.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const summary = buildAssistedMemorySummary({
      whatHappened,
      whatLearned,
      howToUseNextCycle,
      suggestedNextStep,
    });

    const payload = {
      title,
      summary,
      topic_id: topicId || null,
      territory: territory || null,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      status: "active" as const,
      metadata: {
        memoryType,
        source: assistedDraft
          ? {
              type: assistedDraft.sourceType,
              entityId: assistedDraft.sourceEntityId,
              eventId: assistedDraft.eventId,
              href: assistedDraft.sourceHref,
              label: assistedDraft.sourceLabel,
            }
          : null,
        assistedReview: {
          whatHappened,
          whatLearned,
          howToUseNextCycle,
          ethicalCare,
          suggestedNextStep,
        },
      },
    };

    try {
      const result = assistedSource
        ? await createStrategicMemoryFromFieldResultAction(payload, assistedSource)
        : await createStrategicMemoryAction(payload);

      if (result.ok) {
        toast({
          title: "Memória salva",
          description: assistedSource
            ? "Memória revisada e vinculada ao resultado de campo."
            : result.message,
        });
        router.push(`/memoria/${result.id}`);
      } else {
        toast({
          title: "Erro de governança",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao salvar memória estratégica.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {assistedDraft ? (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-950">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Origem assistida
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-zinc-700">
            <p>
              <span className="font-bold text-zinc-950">Origem:</span> {assistedDraft.sourceLabel}
            </p>
            <p>
              <span className="font-bold text-zinc-950">Resumo agregado inicial:</span> {assistedDraft.summary}
            </p>
            <p className="rounded-xl border border-indigo-100 bg-white/80 p-3 text-xs leading-6 text-zinc-600">
              Revise tudo antes de salvar. Este fluxo não cria memória automaticamente e não marca nenhum envio manual.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Ficha da Memória</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da memória</Label>
            <Input
              id="title"
              name="title"
              defaultValue={assistedDraft?.title}
              placeholder="Ex: Registro de Campo - Roda de escuta no território"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="memory_type">Tipo de memória</Label>
              <Select name="memory_type" value={memoryType} onValueChange={handleMemoryTypeChange}>
                <SelectTrigger id="memory_type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ASSISTED_FIELD_MEMORY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic_id">Tema relacionado</Label>
              <Select name="topic_id" value={topicId} onValueChange={handleTopicChange}>
                <SelectTrigger id="topic_id">
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
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="territory">Bairro ou território</Label>
              <Input id="territory" name="territory" defaultValue={assistedDraft?.territory ?? ""} placeholder="Leitura agregada do território" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="period_start">Data inicial</Label>
              <Input id="period_start" name="period_start" type="date" defaultValue={assistedDraft?.periodStart ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="period_end">Data final</Label>
              <Input id="period_end" name="period_end" type="date" defaultValue={assistedDraft?.periodEnd ?? ""} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-100 bg-indigo-50/10">
        <CardHeader>
          <CardTitle className="text-indigo-900">Síntese assistida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="what_happened">O que aconteceu</Label>
            <Textarea
              id="what_happened"
              name="what_happened"
              defaultValue={assistedDraft?.whatHappened ?? ""}
              className="min-h-[120px]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="what_learned">O que aprendemos</Label>
            <Textarea
              id="what_learned"
              name="what_learned"
              defaultValue={assistedDraft?.whatLearned ?? ""}
              className="min-h-[120px]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="how_to_use_next_cycle">Como usar no próximo ciclo</Label>
            <Textarea
              id="how_to_use_next_cycle"
              name="how_to_use_next_cycle"
              defaultValue={assistedDraft?.howToUseNextCycle ?? ""}
              className="min-h-[100px]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ethical_care">Cuidado ético</Label>
            <Textarea
              id="ethical_care"
              name="ethical_care"
              defaultValue={assistedDraft?.ethicalCare ?? ""}
              className="min-h-[100px]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="suggested_next_step">Próximo passo sugerido</Label>
            <Textarea
              id="suggested_next_step"
              name="suggested_next_step"
              defaultValue={assistedDraft?.suggestedNextStep ?? ""}
              className="min-h-[100px]"
              required
            />
          </div>

          {explanationPreview ? (
            <div className="rounded-xl border border-indigo-100 bg-white/80 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-indigo-700">Prévia do resumo salvo</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{explanationPreview}</pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            Checklist obrigatório antes de salvar
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {(Object.keys(EMPTY_CHECKLIST) as Array<keyof AssistedMemoryChecklistState>).map((key) => (
            <label key={key} className="flex items-start gap-3 rounded-xl border border-amber-100 bg-white/80 px-3 py-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={checklist[key]}
                onChange={(inputEvent) =>
                  setChecklist((current) => ({
                    ...current,
                    [key]: inputEvent.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-zinc-300"
              />
              <span>{buildChecklistLabel(key)}</span>
            </label>
          ))}
          <p className="text-xs text-amber-900">
            Campo sem revisão humana não vira memória. Este checklist é obrigatório em toda criação assistida.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <button
          type="submit"
          disabled={loading || !checklistComplete}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all outline-none ring-offset-background focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar memória estratégica
        </button>
      </div>
    </form>
  );
}
