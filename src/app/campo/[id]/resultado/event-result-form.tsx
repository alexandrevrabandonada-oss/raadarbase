"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createEventResultAction } from "../actions";
import { useCompletion } from "@/hooks/use-completion";
import { useRouter } from "next/navigation";

export function EventResultForm({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const { showCompletion } = useCompletion();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createEventResultAction(eventId, formData);
        showCompletion("event_closed");
        // Redirect is handled by the server action, but showCompletion needs to trigger
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Resumo do que aconteceu</label>
        <textarea
          name="resultSummary"
          rows={5}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Quais foram os principais pontos discutidos? Qual foi o sentimento do bairro sobre a pauta?"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estimativa de Pessoas Presentes</label>
        <input
          name="estimatedPeopleCount"
          type="number"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Ex: 25"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Próximos Passos</label>
        <textarea
          name="nextSteps"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="O que deve ser feito após este evento? (ex: novo relatório, resposta pública)"
        />
      </div>

      <div className="pt-4 flex justify-end gap-3">
         <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancelar
         </Button>
         <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar Resultado"}
         </Button>
      </div>
    </form>
  );
}
