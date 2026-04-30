"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmInteractionTopicAction } from "@/app/temas/actions";
import { Check } from "lucide-react";
import type { TopicCategoryRow } from "@/lib/data/topics";

export function ReviewControls({ 
  interactionId, 
  suggestedTopics,
  allTopics
}: { 
  interactionId: string;
  suggestedTopics: TopicCategoryRow[];
  allTopics: TopicCategoryRow[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = (topicIds: string[]) => {
    startTransition(async () => {
      await confirmInteractionTopicAction(interactionId, topicIds);
    });
  };

  const handleAddTopic = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const topicId = e.target.value;
    if (!topicId) return;
    startTransition(async () => {
      await confirmInteractionTopicAction(interactionId, [topicId]);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {suggestedTopics.map((topic) => (
        <Button
          key={topic.id}
          size="sm"
          variant="outline"
          disabled={isPending}
          className="border-green-500/50 hover:bg-green-50"
          onClick={() => handleConfirm([topic.id])}
        >
          <Check className="mr-1 h-3 w-3" />
          Confirmar {topic.name}
        </Button>
      ))}

      <select
        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        disabled={isPending}
        onChange={handleAddTopic}
        value=""
      >
        <option value="" disabled>Adicionar outro tema...</option>
        {allTopics.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {suggestedTopics.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">Sem sugestões automáticas.</div>
      ) : null}
    </div>
  );
}
