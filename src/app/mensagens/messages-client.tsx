"use client";

import { useState, useTransition } from "react";
import { 
  Copy, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Info,
  Clock,
  ExternalLink,
  UserPlus,
  MessageSquare,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { MessageTemplate } from "@/lib/types";
import { removeMessageTemplate, upsertMessageTemplate } from "@/app/actions";
import { cn } from "@/lib/utils";

export function MessagesClient({ initialTemplates }: { initialTemplates: MessageTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [theme, setTheme] = useState("escuta");
  const [category, setCategory] = useState("");
  const [whenToUse, setWhenToUse] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const checklistItems = [
    { id: "check-1", label: "Abrir /pessoas e ver a 'Rotina do Dia'." },
    { id: "check-2", label: "Escolher uma pessoa e abrir o perfil." },
    { id: "check-3", label: "Ler o motivo e a Próxima Ação sugerida." },
    { id: "check-4", label: "Copiar a mensagem e abrir o Instagram." },
    { id: "check-5", label: "Mandar manualmente e registrar a resposta." },
    { id: "check-6", label: "Se houver interesse, fazer o encaminhamento." },
    { id: "check-7", label: "Conferir pendências no quadro de /abordagem." },
  ];

  function addTemplate() {
    if (!name.trim() || !body.trim()) return;
    startTransition(async () => {
      const result = await upsertMessageTemplate(null, { 
        name, 
        body, 
        theme, 
        category: category || null, 
        whenToUse: whenToUse || null 
      });
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) {
        setTemplates((current) => [
          {
            id: result.id || crypto.randomUUID(),
            name,
            body,
            theme,
            category: category || null,
            whenToUse: whenToUse || null,
            active: true,
            updatedAt: new Date().toISOString(),
          },
          ...current,
        ]);
        setName("");
        setBody("");
        setCategory("");
        setWhenToUse("");
      }
    });
  }

  function saveTemplate(template: MessageTemplate) {
    startTransition(async () => {
      const result = await upsertMessageTemplate(template.id, {
        name: template.name,
        theme: template.theme,
        body: template.body,
        category: template.category,
        whenToUse: template.whenToUse,
      });
      setFeedback(result.ok ? result.message : result.error);
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
      {/* Sidebar: Roteiro e Guardrails */}
      <div className="flex flex-col gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-white to-primary/5 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              <CardTitle className="text-lg">Roteiro diário</CardTitle>
            </div>
            <CardDescription>Checklist operacional para a equipe.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {checklistItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm group cursor-pointer">
                  <div className="mt-0.5 h-4 w-4 rounded border border-primary/30 bg-white flex items-center justify-center group-hover:border-primary transition-colors">
                    <CheckCircle2 className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="leading-none text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-3 text-red-900 bg-red-100/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <CardTitle className="text-lg">Regras de Cuidado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-red-800">
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Não mandar mensagem em massa.</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Não pedir voto na pré-campanha.</span>
              </li>
              <li className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-red-600" />
                <span>Sempre contextualizar a abordagem.</span>
              </li>
              <li className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-red-600" />
                <span>Respeitar pedidos de não contato.</span>
              </li>
              <li className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-red-600" />
                <span>Não registrar dados sensíveis.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Novo modelo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Título</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Convite Missão ÉLuta" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Categoria</label>
              <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex: Respondeu story" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Quando usar</label>
              <Input value={whenToUse} onChange={(event) => setWhenToUse(event.target.value)} placeholder="Ex: Para quem interage muito..." />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Tema de fallback</label>
              <Input value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="escuta, grupo, etc" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Texto</label>
              <Textarea 
                value={body} 
                onChange={(event) => setBody(event.target.value)} 
                placeholder="Texto com {username}, {tema}..." 
                className="min-h-[120px]"
              />
            </div>
            <Button type="button" onClick={addTemplate} disabled={isPending} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Criar modelo
            </Button>
            {feedback ? <p className="text-center text-xs text-muted-foreground">{feedback}</p> : null}
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Templates Library */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-primary">Biblioteca Operacional</h2>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Pré-campanha segura
          </Badge>
        </div>

        <div className="grid gap-4">
          {templates.length === 0 && (
            <Alert className="border-amber-200 bg-amber-50/60">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Nenhum template ativo</AlertTitle>
              <AlertDescription className="text-amber-700">
                A biblioteca de DMs está vazia. Cadastre os templates-base usando o formulário ao lado ou peça ao administrador para rodar o script de seed inicial.
              </AlertDescription>
            </Alert>
          )}

          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">{template.name}</h3>
                    {template.category && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                  
                  {template.whenToUse && (
                    <p className="mb-4 text-sm text-muted-foreground italic flex items-start gap-1.5">
                      <Info className="h-4 w-4 mt-0.5 shrink-0" />
                      <span><strong>Quando usar:</strong> {template.whenToUse}</span>
                    </p>
                  )}

                  <div className="relative group">
                    <Textarea
                      value={template.body}
                      onChange={(event) =>
                        setTemplates((current) =>
                          current.map((item) => item.id === template.id ? { ...item, body: event.target.value } : item),
                        )
                      }
                      className="min-h-[100px] bg-muted/30 focus-visible:bg-white transition-colors border-dashed"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[10px] text-yellow-700 flex items-center gap-1 font-medium uppercase tracking-wider">
                        <AlertTriangle className="h-3 w-3" />
                        Revise e contextualize antes de enviar
                      </p>
                      <div className="flex gap-2">
                         <Button 
                          type="button" 
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(template.body);
                            setFeedback("Copiado!");
                            setTimeout(() => setFeedback(null), 2000);
                          }} 
                          disabled={isPending}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copiar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          variant="ghost" 
                          onClick={() => saveTemplate(template)} 
                          disabled={isPending}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-16 bg-muted/10 border-l flex sm:flex-col items-center justify-center gap-2 p-2 sm:p-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive transition-colors"
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
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
