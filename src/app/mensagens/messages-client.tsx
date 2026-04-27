"use client";

import { useState, useTransition } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MessageTemplate } from "@/lib/types";
import { removeMessageTemplate, upsertMessageTemplate } from "@/app/actions";

export function MessagesClient({ initialTemplates }: { initialTemplates: MessageTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [theme, setTheme] = useState("escuta");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function addTemplate() {
    if (!name.trim() || !body.trim()) return;
    startTransition(async () => {
      const result = await upsertMessageTemplate(null, { name, body, theme });
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) {
        setTemplates((current) => [
          {
            id: crypto.randomUUID(),
            name,
            body,
            theme,
            active: true,
            updatedAt: new Date().toISOString(),
          },
          ...current,
        ]);
        setName("");
        setBody("");
      }
    });
  }

  function saveTemplate(template: MessageTemplate) {
    startTransition(async () => {
      const result = await upsertMessageTemplate(template.id, {
        name: template.name,
        theme: template.theme,
        body: template.body,
      });
      setFeedback(result.ok ? result.message : result.error);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Novo modelo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do modelo" />
          <Input value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="Tema" />
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Texto com {username}, {tema}, {link_grupo}..." />
          <Button type="button" onClick={addTemplate} disabled={isPending}>
            <Plus data-icon="inline-start" />
            Criar modelo
          </Button>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
        <Alert className="border-yellow-500/40 bg-yellow-100 text-black">
          <AlertTitle>Envio manual.</AlertTitle>
          <AlertDescription>Não use para disparo em massa.</AlertDescription>
        </Alert>
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                value={template.body}
                onChange={(event) =>
                  setTemplates((current) =>
                    current.map((item) => item.id === template.id ? { ...item, body: event.target.value } : item),
                  )
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => navigator.clipboard.writeText(template.body)} disabled={isPending}>
                  <Copy data-icon="inline-start" />
                  Copiar
                </Button>
                <Button type="button" variant="outline" onClick={() => saveTemplate(template)} disabled={isPending}>
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await removeMessageTemplate(template.id);
                      setFeedback(result.ok ? result.message : result.error);
                      if (result.ok) {
                        setTemplates((current) => current.filter((item) => item.id !== template.id));
                      }
                    })
                  }
                  disabled={isPending}
                >
                  <Trash2 data-icon="inline-start" />
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
      </div>
    </div>
  );
}
