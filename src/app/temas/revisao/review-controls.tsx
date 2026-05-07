"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmInteractionTopicAction, removeInteractionTopicAction } from "@/app/temas/actions";
import { Check, X } from "lucide-react";
import type { TopicCategoryRow } from "@/lib/data/topics";

export function ReviewControls({ 
  interactionId, 
  suggestedTopics,
  allTopics,
  currentTopics = [],
}: { 
  interactionId: string;
  suggestedTopics: TopicCategoryRow[];
  allTopics: TopicCategoryRow[];
  currentTopics?: Array<{ topic?: TopicCategoryRow | null; topic_id?: string; source?: string }>;
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

  const handleRemoveTopic = (topicId: string) => {
    startTransition(async () => {
      await removeInteractionTopicAction(interactionId, topicId);
    });
  };

  return (
    <div className="space-y-3">
      {currentTopics.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temas atuais</span>
          {currentTopics.map((entry) => {
            const topic = entry.topic ?? allTopics.find((item) => item.id === entry.topic_id) ?? null;
            if (!topic) return null;

            return (
              <div key={topic.id} className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
                <span>{topic.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveTopic(topic.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}

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
    </div>
  );
}
