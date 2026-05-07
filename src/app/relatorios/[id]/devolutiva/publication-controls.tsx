"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  archiveDevolutionPublicationAction,
  markDevolutionPublishedAction,
  markDevolutionReviewedAction,
} from "./actions";

type PublicationState = {
  id: string;
  status: string;
  published_url: string | null;
  instagram_post_url: string | null;
  whatsapp_shared: boolean;
} | null;

export function DevolutionPublicationControls({ reportId, publication }: { reportId: string; publication: PublicationState }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [whatsappShared, setWhatsappShared] = useState(publication?.whatsapp_shared ?? false);
  const router = useRouter();

  function refreshAfterSuccess(ok: boolean) {
    if (ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border px-3 py-1 uppercase tracking-wider">{publication?.status ?? "draft"}</span>
        <span className="rounded-full border px-3 py-1 uppercase tracking-wider">
          WhatsApp compartilhado: {publication?.whatsapp_shared ? "sim" : "não"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await markDevolutionReviewedAction(reportId);
              setFeedback(result.ok ? { type: "success", text: result.message } : { type: "error", text: result.error });
              refreshAfterSuccess(result.ok);
            });
          }}
        >
          Marcar revisado
        </Button>

        {publication?.id ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={isPending}
            onClick={() => {
              if (!confirm("Arquivar esta publicação?")) return;
              startTransition(async () => {
                const result = await archiveDevolutionPublicationAction(publication.id);
                setFeedback(result.ok ? { type: "success", text: result.message } : { type: "error", text: result.error });
                refreshAfterSuccess(result.ok);
              });
            }}
          >
            Arquivar
          </Button>
        ) : null}
      </div>

      <form
        className="space-y-4 rounded-md border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await markDevolutionPublishedAction(reportId, {
              publishedUrl: String(formData.get("published_url") ?? "").trim(),
              instagramPostUrl: String(formData.get("instagram_post_url") ?? "").trim(),
              whatsappShared,
            });
            setFeedback(result.ok ? { type: "success", text: result.message } : { type: "error", text: result.error });
            refreshAfterSuccess(result.ok);
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="URL publicada" htmlFor="published_url">
            <Input id="published_url" name="published_url" defaultValue={publication?.published_url ?? ""} placeholder="https://..." />
          </Field>
          <Field label="URL do post no Instagram" htmlFor="instagram_post_url">
            <Input id="instagram_post_url" name="instagram_post_url" defaultValue={publication?.instagram_post_url ?? ""} placeholder="https://instagram.com/..." />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={whatsappShared} onChange={(event) => setWhatsappShared(event.target.checked)} />
          Compartilhado em grupos de WhatsApp
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            Publicar
          </Button>
        </div>
      </form>

      {feedback ? <p className={feedback.type === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700"}>{feedback.text}</p> : null}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: import("react").ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
