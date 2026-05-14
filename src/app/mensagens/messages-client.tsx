"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { 
  Copy, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  Info,
  Clock,
  MessageSquare,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { MessageTemplate } from "@/lib/types";
import { removeMessageTemplate, upsertMessageTemplate } from "@/app/actions";
import { cn } from "@/lib/utils";

// Radar Design System
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { RadarMetricCard } from "@/components/radar/radar-metric-card";
import { OperationalAlert } from "@/components/radar/operational-alert";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";


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

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.active).length,
    escuta: templates.filter(t => t.theme === "escuta").length,
    continuidade: templates.filter(t => t.theme === "conversao").length,
  };

  const activeTemplates = templates.filter(t => t.active);

  return (
    <div className="flex flex-col gap-8 pb-20">
      <RadarPageHeader 
        eyebrow="Biblioteca de Abordagem"
        title="Modelos de Mensagem"
        description="Textos base para iniciar conversas humanizadas e éticas no Instagram."
      />

      <ContextHelpCard 
        title="Como usar os modelos de forma eficiente"
        whatIsThis="Esta é sua biblioteca de textos base. Eles servem como ponto de partida para manter a unidade da linguagem e facilitar o início do relacionamento."
        whyItMatters="Garante que a comunicação seja profissional e acolhedora, evitando que você precise criar textos do zero para cada pessoa."
        whatToDoNow="O segredo é o fluxo: Copie o modelo → Abra o Instagram → Personalize o texto manualmente → Registre a resposta no Radar."
        className="max-w-4xl"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RadarMetricCard label="Modelos totais" value={stats.total} icon={MessageSquare} tone="neutral" />
        <RadarMetricCard label="Templates Ativos" value={stats.active} icon={ShieldCheck} tone="success" />
        <RadarMetricCard label="Foco: Escuta" value={stats.escuta} icon={Info} tone="info" />
        <RadarMetricCard label="Foco: Continuidade" value={stats.continuidade} icon={History} tone="warning" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        {/* Sidebar: Roteiro e Guardrails */}
        <div className="flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-white ring-1 ring-zinc-100 overflow-hidden">
            <CardHeader className="pb-3 bg-indigo-600">
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-4 w-4" />
                <CardTitle className="text-[10px] font-black uppercase tracking-widest">Fluxo do Relacionamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-4">
                {checklistItems.map((item, i) => (
                  <li key={item.id} className="flex items-start gap-3 text-xs group">
                    <div className="mt-0.5 h-5 w-5 rounded-full border-2 border-zinc-100 bg-zinc-50 flex items-center justify-center font-black text-[9px] text-zinc-400 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all">
                      {i + 1}
                    </div>
                    <span className="font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors pt-0.5">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <OperationalAlert 
            type="templates_ausentes" 
            className="border-rose-100 bg-rose-50"
          >
             <p className="text-[10px] font-bold text-rose-900 uppercase tracking-tight mb-1">Atenção: Contato Manual</p>
             <p className="text-[11px] text-rose-800 leading-tight">O Instagram bloqueia automações. Sempre copie, cole e revise o texto manualmente no app do Instagram.</p>
          </OperationalAlert>

          <Card className="border-none shadow-sm bg-rose-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-700">Regras de Cuidado</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-rose-800">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>Não mandar mensagem em massa.</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>Não pedir voto na pré-campanha.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>Sempre contextualizar a abordagem.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>Respeitar pedidos de não contato.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Info className="h-3 w-3 shrink-0" />
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
                <Input id="template-form-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Convite Missão ÉLuta" />
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
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
               <h2 className="text-xl font-black text-indigo-950 flex items-center gap-2">
                 <MessageSquare className="h-5 w-5 text-indigo-600" />
                 Biblioteca de Abordagem
               </h2>
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Templates sugeridos para conversas humanizadas.</p>
            </div>
            <Badge variant="outline" className="h-6 bg-emerald-50 text-emerald-700 border-emerald-200 font-black text-[9px] uppercase tracking-widest self-start md:self-center">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Engajamento Seguro
            </Badge>
          </div>

          <div className="grid gap-6">
            {activeTemplates.length === 0 ? (
              <GamefulEmptyState
                variant="memory"
                title="Nenhum template ativo"
                description="Sua biblioteca ainda não tem modelos prontos para abrir conversa com segurança e contexto."
                nextActionLabel="preparar o primeiro modelo"
                primaryAction={
                  <Button className="h-11 rounded-xl bg-zinc-950 text-xs font-black uppercase tracking-[0.18em] hover:bg-zinc-800" onClick={() => document.getElementById("template-form-name")?.focus()}>
                    <Plus className="mr-2 h-4 w-4" /> Criar primeiro template
                  </Button>
                }
                secondaryAction={
                  <Button variant="outline" className="h-11 rounded-xl border-zinc-200 bg-white text-xs font-black uppercase tracking-[0.18em]" nativeButton={false} render={<Link href="/pessoas" />}>
                    Abrir prioridades
                  </Button>
                }
              />
            ) : (
              activeTemplates.map((template) => (
                <Card key={template.id} className="relative border-none shadow-sm transition-all hover:shadow-md bg-white ring-1 ring-zinc-100 overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-black text-indigo-950">{template.name}</h3>
                          {template.category && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] font-black uppercase tracking-widest">
                              {template.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={cn(
                             "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                             template.theme === "escuta" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                           )}>
                             {template.theme}
                           </span>
                        </div>
                      </div>
                      
                      {template.whenToUse && (
                        <p className="text-[11px] font-medium text-zinc-500 italic flex items-start gap-2 bg-zinc-50 p-2 rounded-lg border border-dashed border-zinc-200">
                          <Info className="h-3 w-3 mt-0.5 shrink-0 text-indigo-400" />
                          <span><strong>Contexto:</strong> {template.whenToUse}</span>
                        </p>
                      )}

                      <div className="space-y-3">
                        <Textarea
                          value={template.body}
                          onChange={(event) =>
                            setTemplates((current) =>
                              current.map((item) => item.id === template.id ? { ...item, body: event.target.value } : item)
                            )
                          }
                          className="min-h-[100px] bg-white border-zinc-100 focus-visible:ring-indigo-500 font-medium text-sm leading-relaxed"
                        />
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          <p className="text-[9px] text-amber-700 flex items-center gap-1.5 font-black uppercase tracking-widest">
                            <AlertTriangle className="h-3 w-3" />
                            Contextualize sempre antes de enviar
                          </p>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                             <Button 
                              type="button" 
                              size="sm"
                              variant="outline"
                              className="flex-1 sm:flex-none h-8 font-black text-[10px] uppercase border-zinc-200 hover:bg-zinc-50"
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
                              className="flex-1 sm:flex-none h-8 font-black text-[10px] uppercase bg-black text-white hover:bg-zinc-800"
                              onClick={() => saveTemplate(template)} 
                              disabled={isPending}
                            >
                              Salvar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-16 bg-zinc-50 border-t lg:border-t-0 lg:border-l border-zinc-100 flex lg:flex-col items-center justify-center gap-2 p-4 lg:p-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
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
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
