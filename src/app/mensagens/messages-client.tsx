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
  MessageSquare,
  Scroll,
  Sparkles,
  BookOpen,
  Megaphone,
  ClipboardCheck,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { MessageTemplate } from "@/lib/types";
import { removeMessageTemplate, upsertMessageTemplate, setCampaignDefaultTemplate } from "@/app/actions";
import { cn } from "@/lib/utils";

// Radar Design System
import { RadarPageHeader } from "@/components/radar/radar-page-header";
import { RadarMetricCard } from "@/components/radar/radar-metric-card";
import { OperationalAlert } from "@/components/radar/operational-alert";
import { ContextHelpCard } from "@/components/radar/context-help-card";
import { GamefulEmptyState } from "@/components/radar/gameful-empty-state";
import {
  announcementPublicationChannels,
  readAnnouncementPublicationState,
  writeAnnouncementPublicationState,
  type AnnouncementChannelId,
} from "@/lib/announcement-publications";

// Play copy sound using Web Audio API (tactical feedback)
function playCopySound() {
  try {
    if (typeof window !== "undefined") {
      const isMuted = localStorage.getItem("radar_audio_muted") === "true";
      if (isMuted) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.1); // A5
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // Ignore audio context failures gracefully
  }
}

const publicPreCandidacyAnnouncement =
  "Comunicado publico: estou me colocando como pre-candidato para abrir uma etapa de escuta, organizacao e construcao coletiva na cidade. Vou compartilhar os proximos encontros, pautas e formas de participacao pelos canais abertos. Quem quiser acompanhar pode responder por aqui ou procurar a equipe.";

const announcementFormats = [
  {
    id: "post",
    label: "Post",
    detail: "Texto base para feed ou legenda.",
    body: publicPreCandidacyAnnouncement,
  },
  {
    id: "story",
    label: "Story",
    detail: "Fala curta para arte ou video rápido.",
    body: "Comecou uma nova etapa: estou me colocando como pre-candidato. Quero abrir conversas publicas sobre cidade, escuta e organizacao. Acompanhe os proximos passos por aqui.",
  },
  {
    id: "fala",
    label: "Fala curta",
    detail: "Roteiro para abertura de video.",
    body: "Quero contar com clareza: estou me apresentando como pre-candidato. Esta primeira fase e para a cidade saber disso, ouvir as pautas que aparecem e organizar os proximos encontros com responsabilidade.",
  },
] as const;

// Sub-component for sidebar content to avoid duplicate layouts for mobile vs desktop
interface SidebarContentProps {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  whenToUse: string;
  setWhenToUse: (v: string) => void;
  theme: string;
  setTheme: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  addTemplate: () => void;
  isPending: boolean;
  feedback: string | null;
  checklistItems: Array<{ id: string; label: string }>;
  idPrefix: string;
}

function SidebarContent({
  name,
  setName,
  category,
  setCategory,
  whenToUse,
  setWhenToUse,
  theme,
  setTheme,
  body,
  setBody,
  addTemplate,
  isPending,
  feedback,
  checklistItems,
  idPrefix,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Roteiro */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-[#121c24] to-[#0a1015] border border-[#23323e] overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#23323e] bg-[#121c24]">
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d4b678]">
              Trilha de Escuta Ativa
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-4">
            {checklistItems.map((item, i) => (
              <li key={item.id} className="flex items-start gap-3 text-xs group">
                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-indigo-500/30 bg-[#0e161c] flex items-center justify-center font-black text-[9px] text-[#f0c15b] shadow-inner group-hover:border-indigo-400 group-hover:scale-110 transition-all">
                  {i + 1}
                </div>
                <span className="font-bold text-zinc-300 group-hover:text-white transition-colors pt-1">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Guardrails */}
      <OperationalAlert 
        type="templates_ausentes" 
        className="border-amber-500/20 bg-amber-500/5 text-amber-200"
      >
        <p className="text-[10px] font-black text-[#f0c15b] uppercase tracking-[0.15em] mb-1">
          Regra de Ouro: Contato 100% Humano
        </p>
        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
          O Instagram penaliza robôs. Copie o template abaixo, abra a conversa no app e personalize o texto com as palavras corretas de acordo com a sua escuta.
        </p>
      </OperationalAlert>

      {/* Selos de Proteção */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-[#1c1212] to-[#120a0a] border border-[#3e2323] overflow-hidden">
        <CardHeader className="pb-2 border-b border-[#3e2323] bg-[#1c1212]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-rose-400 animate-pulse" />
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-400">
              Selos de Proteção Ética
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2.5 text-zinc-300 hover:text-white transition-colors">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <span className="font-semibold leading-relaxed">Não mandar mensagem em massa (limite saudável por hora).</span>
            </li>
            <li className="flex items-start gap-2.5 text-zinc-300 hover:text-white transition-colors">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#f0c15b] mt-0.5" />
              <span className="font-semibold leading-relaxed">Não pedir voto na pré-campanha (focar em acolhimento e escuta).</span>
            </li>
            <li className="flex items-start gap-2.5 text-zinc-300 hover:text-white transition-colors">
              <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
              <span className="font-semibold leading-relaxed">Sempre contextualizar a abordagem de acordo com a interação da pessoa.</span>
            </li>
            <li className="flex items-start gap-2.5 text-zinc-300 hover:text-white transition-colors">
              <Info className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span className="font-semibold leading-relaxed">Respeitar pedidos de não contato (DNC) imediatamente.</span>
            </li>
            <li className="flex items-start gap-2.5 text-zinc-300 hover:text-white transition-colors">
              <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
              <span className="font-semibold leading-relaxed">Nunca classificar ou rotular a ideologia/voto da pessoa.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Formulário Novo Modelo */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-[#121c24] to-[#0a1015] border border-[#23323e]">
        <CardHeader className="border-b border-[#23323e] bg-[#121c24]">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 text-[#f0c15b]" />
            <CardTitle className="text-sm font-black uppercase tracking-[0.12em] text-[#f0c15b]">
              Forjar Novo Roteiro
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid gap-2">
            <label htmlFor={`${idPrefix}-name`} className="text-[10px] font-black uppercase tracking-wider text-[#d4b678]">
              Título da Abordagem
            </label>
            <Input 
              id={`${idPrefix}-name`} 
              value={name} 
              onChange={(event) => setName(event.target.value)} 
              placeholder="Ex: Resposta Story Mobilidade" 
              className="bg-[#0e161c] border-[#23323e] text-white focus-visible:ring-[#f0c15b] placeholder:text-zinc-500 font-bold"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${idPrefix}-category`} className="text-[10px] font-black uppercase tracking-wider text-[#d4b678]">
              Categoria do Gatilho
            </label>
            <Input 
              id={`${idPrefix}-category`}
              value={category} 
              onChange={(event) => setCategory(event.target.value)} 
              placeholder="Ex: Interação em Enquete" 
              className="bg-[#0e161c] border-[#23323e] text-white focus-visible:ring-[#f0c15b] placeholder:text-zinc-500 font-bold"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${idPrefix}-whenToUse`} className="text-[10px] font-black uppercase tracking-wider text-[#d4b678]">
              Quando Lançar (Contexto)
            </label>
            <Input 
              id={`${idPrefix}-whenToUse`}
              value={whenToUse} 
              onChange={(event) => setWhenToUse(event.target.value)} 
              placeholder="Ex: Quando a pessoa responde SIM na enquete..." 
              className="bg-[#0e161c] border-[#23323e] text-white focus-visible:ring-[#f0c15b] placeholder:text-zinc-500 font-bold"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${idPrefix}-theme`} className="text-[10px] font-black uppercase tracking-wider text-[#d4b678]">
              Essência / Foco
            </label>
            <select
              id={`${idPrefix}-theme`}
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="w-full h-10 rounded-md bg-[#0e161c] border border-[#23323e] text-white px-3 text-sm focus-visible:ring-[#f0c15b] focus:border-[#f0c15b] font-bold"
            >
              <option value="escuta">🌀 Rito de Escuta (escuta)</option>
              <option value="conversao">🔥 Rito de Vínculo (conversão)</option>
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor={`${idPrefix}-body`} className="text-[10px] font-black uppercase tracking-wider text-[#d4b678]">
              Fórmula de Abordagem (Texto)
            </label>
            <Textarea 
              id={`${idPrefix}-body`}
              value={body} 
              onChange={(event) => setBody(event.target.value)} 
              placeholder="Olá {username}, tudo bem? Vi que você comentou sobre {tema}..." 
              className="min-h-[120px] bg-[#0e161c] border-[#23323e] text-white focus-visible:ring-[#f0c15b] placeholder:text-zinc-500 font-medium text-sm leading-relaxed"
            />
          </div>
          <Button 
            type="button" 
            onClick={addTemplate} 
            disabled={isPending} 
            className="w-full bg-[#f0c15b] hover:bg-[#d8a846] text-black font-black uppercase tracking-widest text-xs h-11 shadow-[0_4px_12px_rgba(240,193,91,0.2)]"
          >
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            Consagrar Modelo
          </Button>
          {feedback ? <p className="text-center text-xs font-bold text-[#f0c15b]">{feedback}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function MessagesClient({ initialTemplates }: { initialTemplates: MessageTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [theme, setTheme] = useState("escuta");
  const [category, setCategory] = useState("");
  const [whenToUse, setWhenToUse] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [announcementPublications, setAnnouncementPublications] = useState(readAnnouncementPublicationState);

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
            isCampaignDefault: false,
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

  function handleSetCampaignDefault(templateId: string) {
    const isCurrentDefault = templates.find((t) => t.id === templateId)?.isCampaignDefault || false;
    startTransition(async () => {
      const result = await setCampaignDefaultTemplate(templateId);
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) {
        setTemplates((current) =>
          current.map((item) => ({
            ...item,
            isCampaignDefault: item.id === templateId ? !isCurrentDefault : false,
          }))
        );
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

  function copyAnnouncement(bodyToCopy: string, label: string) {
    navigator.clipboard.writeText(bodyToCopy);
    playCopySound();
    setFeedback(`${label} copiado.`);
    setTimeout(() => setFeedback(null), 2000);
  }

  function toggleAnnouncementPublication(channelId: AnnouncementChannelId) {
    setAnnouncementPublications((current) => {
      const next = { ...current, [channelId]: !current[channelId] };
      writeAnnouncementPublicationState(next);
      return next;
    });
  }

  const publicationCount = Object.values(announcementPublications).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-8 pb-20">
      <RadarPageHeader 
        eyebrow="Biblioteca de Abordagem"
        title="Grimório Tático de Mensagens"
        description="Fórmulas e roteiros de escuta ativa para contatos manuais e seguros."
        compact
      />

      <ContextHelpCard 
        title="O Segredo da Transmissão e Conversa"
        whatIsThis="Este é o Grimório de Abordagens do Radar. Cada card representa uma fórmula refinada para conectar com a base real sem automatizações robotizadas."
        whyItMatters="Automatizações geram bloqueios e quebram a confiança. Copiar fórmulas consagradas garante padrão de linguagem ética e acolhedora."
        whatToDoNow="Escolha uma fórmula → Clique em Copiar (emitirá um sinal de conjuração) → Adapte manualmente na conversa do Instagram."
        className="max-w-4xl border border-[#23323e] bg-gradient-to-br from-[#121c24] to-[#0a1015]"
      />

      <Card className="overflow-hidden border-2 border-[#0b0b0b] bg-[#fff8ed] py-0 shadow-[4px_4px_0px_0px_rgba(17,32,42,0.16)]">
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center border-2 border-charcoal bg-burnt-yellow text-charcoal">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7759]">
                  Preparar primeira fala
                </p>
                <h2 className="text-xl font-black tracking-tight text-charcoal">
                  Comunicado publico da temporada
                </h2>
              </div>
            </div>

              <p className="max-w-2xl text-sm font-semibold leading-6 text-[#4b4337]">
                Esta rodada existe para abrir conhecimento publico da pre-candidatura. Publique primeiro; organize os retornos depois.
              </p>
            </div>

            <div className="border-2 border-[#d8c7ac] bg-white/70 p-4">
              <div className="flex items-center gap-2 text-charcoal">
                <ClipboardCheck className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Regra da rodada</p>
              </div>
              <ul className="mt-4 space-y-3 text-sm font-semibold leading-5 text-[#4b4337]">
                <li>Primeira etapa: tornar a pre-candidatura conhecida com fala publica clara.</li>
                <li>Publicar para audiencia ampla antes de iniciar conversas individuais.</li>
                <li>Usar DM apenas com contexto manual, pedido da pessoa ou consentimento registrado.</li>
                <li>Nao segmentar nem disparar para seguidores por engajamento.</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-3 md:grid-cols-3">
              {announcementFormats.map((format) => (
                <div key={format.id} className="flex min-w-0 flex-col border-2 border-charcoal bg-white p-3 shadow-[2px_2px_0px_0px_rgba(11,11,11,0.16)]">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b7759]">{format.detail}</p>
                      <p className="text-base font-black text-charcoal">{format.label}</p>
                    </div>
                    <Radio className="h-4 w-4 shrink-0 text-burnt-yellow" />
                  </div>
                  <Textarea
                    readOnly
                    value={format.body}
                    className="min-h-[150px] flex-1 border-2 border-[#d8c7ac] bg-[#fff8ed] text-xs font-semibold leading-5 text-charcoal"
                  />
                  <Button
                    type="button"
                    onClick={() => copyAnnouncement(format.body, format.label)}
                    className="mt-3 h-10 border-2 border-charcoal bg-charcoal text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-charcoal/90"
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copiar
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-2 border-charcoal bg-charcoal p-4 text-off-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-burnt-yellow">Checklist da rodada</p>
                  <h3 className="mt-1 text-lg font-black">Publicacao inicial</h3>
                </div>
                <div className="border-2 border-burnt-yellow bg-burnt-yellow px-2 py-1 text-xs font-black text-charcoal">
                  {publicationCount}/{announcementPublicationChannels.length}
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {announcementPublicationChannels.map((channel) => (
                  <label key={channel.id} className="flex cursor-pointer items-start gap-3 border-2 border-cement/50 bg-black/20 p-3">
                    <input
                      type="checkbox"
                      checked={announcementPublications[channel.id]}
                      onChange={() => toggleAnnouncementPublication(channel.id)}
                      className="mt-0.5 size-4 accent-[#f2a900]"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-black">
                        {announcementPublications[channel.id] ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : null}
                        {channel.label}
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-zinc-300">{channel.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-semibold leading-5 text-zinc-400">
                Este registro fica neste navegador e nao cria lista de pessoas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RadarMetricCard label="Modelos totais" value={stats.total} icon={MessageSquare} tone="neutral" />
        <RadarMetricCard label="Templates Ativos" value={stats.active} icon={ShieldCheck} tone="success" />
        <RadarMetricCard label="Foco: Ritos de Escuta" value={stats.escuta} icon={Scroll} tone="info" />
        <RadarMetricCard label="Foco: Ritos de Vínculo" value={stats.continuidade} icon={Sparkles} tone="warning" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        {/* Sidebar: Roteiro e Guardrails (Mobile) */}
        <div className="order-2 flex flex-col gap-6 xl:order-1">
          <details className="border-none bg-white/0 xl:hidden">
            <summary className="list-none cursor-pointer rounded-2xl border border-[#23323e] bg-[#0c141b] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[#f0c15b] shadow-md flex items-center justify-between">
              <span>Opções e Forja do Grimório</span>
              <BookOpen className="h-4 w-4" />
            </summary>
            <div className="mt-4">
              <SidebarContent 
                name={name}
                setName={setName}
                category={category}
                setCategory={setCategory}
                whenToUse={whenToUse}
                setWhenToUse={setWhenToUse}
                theme={theme}
                setTheme={setTheme}
                body={body}
                setBody={setBody}
                addTemplate={addTemplate}
                isPending={isPending}
                feedback={feedback}
                checklistItems={checklistItems}
                idPrefix="mobile"
              />
            </div>
          </details>

          {/* Sidebar: Roteiro e Guardrails (Desktop) */}
          <div className="hidden flex-col gap-6 xl:flex">
            <SidebarContent 
              name={name}
              setName={setName}
              category={category}
              setCategory={setCategory}
              whenToUse={whenToUse}
              setWhenToUse={setWhenToUse}
              theme={theme}
              setTheme={setTheme}
              body={body}
              setBody={setBody}
              addTemplate={addTemplate}
              isPending={isPending}
              feedback={feedback}
              checklistItems={checklistItems}
              idPrefix="desktop"
            />
          </div>
        </div>

        {/* Main Content: Templates Library */}
        <div className="order-1 flex flex-col gap-8 xl:order-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
               <h2 className="text-xl font-black text-white flex items-center gap-2">
                 <Scroll className="h-5 w-5 text-[#f0c15b]" />
                 Abas do Grimório
               </h2>
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fórmulas catalogadas para transmissão de base.</p>
            </div>
            <Badge variant="outline" className="h-6 bg-emerald-950/40 text-emerald-400 border-emerald-500/30 font-black text-[9px] uppercase tracking-widest self-start md:self-center shadow-[0_0_10px_rgba(52,211,153,0.15)]">
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
                  <Button className="h-11 rounded-xl bg-[#f0c15b] text-black font-black uppercase tracking-[0.18em] hover:bg-[#d8a846]" onClick={() => document.getElementById("desktop-name")?.focus()}>
                    <Plus className="mr-2 h-4 w-4" /> Criar primeira fórmula
                  </Button>
                }
                secondaryAction={
                  <Button variant="outline" className="h-11 rounded-xl border-[#23323e] bg-transparent text-xs font-black uppercase tracking-[0.18em] text-[#d4b678] hover:bg-zinc-800" nativeButton={false} render={<Link href="/pessoas" />}>
                    Abrir prioridades
                  </Button>
                }
              />
            ) : (
              activeTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:scale-[1.008] shadow-lg border p-0",
                    template.isCampaignDefault
                      ? "border-[#f2a900] border-2 bg-gradient-to-br from-[#1c1a15] to-[#0c0a07] text-white shadow-[#f2a900]/10"
                      : template.theme === "escuta" 
                        ? "border-sky-500/20 bg-gradient-to-br from-[#0c131a] to-[#070b0e] text-white shadow-sky-950/20" 
                        : "border-amber-500/20 bg-gradient-to-br from-[#16120c] to-[#0d0a07] text-white shadow-amber-950/20"
                  )}
                >
                  <div className="absolute top-0 right-0 p-1 opacity-[0.03]">
                    {template.isCampaignDefault ? (
                      <Megaphone className="h-24 w-24 text-white pointer-events-none select-none" />
                    ) : (
                      <Scroll className="h-24 w-24 text-white pointer-events-none select-none" />
                    )}
                  </div>
                  <div className="flex flex-col lg:flex-row relative z-10">
                    <div className="flex-1 p-6 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-black tracking-tight text-[#f3f4f6]">
                            {template.name}
                          </h3>
                          {template.isCampaignDefault && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] font-black uppercase tracking-widest bg-burnt-yellow/20 text-[#f2a900] border-burnt-yellow shadow-[0_0_10px_rgba(242,169,0,0.15)] animate-pulse"
                            >
                              📢 Campanha Ativa
                            </Badge>
                          )}
                          {template.category && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                template.isCampaignDefault
                                  ? "bg-burnt-yellow/10 text-burnt-yellow border-burnt-yellow/30"
                                  : template.theme === "escuta"
                                    ? "bg-sky-500/10 text-sky-300 border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.1)]"
                                    : "bg-amber-500/10 text-[#f0c15b] border-amber-500/30 shadow-[0_0_10px_rgba(240,193,91,0.1)]"
                              )}
                            >
                              {template.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={cn(
                             "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border",
                             template.theme === "escuta" 
                               ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                               : "bg-amber-500/10 text-[#f0c15b] border-amber-500/20"
                           )}>
                             {template.theme === "escuta" ? "🌀 Rito de Escuta" : "🔥 Selo de Vínculo"}
                           </span>
                        </div>
                      </div>
                      
                      {template.whenToUse && (
                        <p className="text-[11px] font-semibold text-zinc-400 flex items-start gap-2 bg-black/35 p-3 rounded-xl border border-[#23323e]">
                          <Info className="h-4.5 w-4.5 mt-0.5 shrink-0 text-indigo-400" />
                          <span><strong className="text-zinc-300 font-bold">Contexto de Uso:</strong> {template.whenToUse}</span>
                        </p>
                      )}

                      <div className="space-y-4">
                        <Textarea
                          value={template.body}
                          onChange={(event) =>
                            setTemplates((current) =>
                              current.map((item) => item.id === template.id ? { ...item, body: event.target.value } : item)
                            )
                          }
                          className="min-h-[110px] bg-black/40 border-[#23323e] focus-visible:ring-[#f0c15b] text-zinc-100 font-medium text-sm leading-relaxed placeholder:text-zinc-600"
                        />
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className="text-[9.5px] text-amber-500/90 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                            <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-[#f0c15b]" />
                            Adapte os detalhes antes de enviar
                          </p>
                          <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <Button 
                              type="button" 
                              size="sm"
                              variant={template.isCampaignDefault ? "default" : "outline"}
                              className={cn(
                                "flex-1 sm:flex-none h-9 font-black text-[10px] uppercase",
                                template.isCampaignDefault 
                                  ? "bg-burnt-yellow text-charcoal border-2 border-black hover:bg-burnt-yellow/80 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]" 
                                  : "border-burnt-yellow/40 hover:border-burnt-yellow bg-transparent hover:bg-burnt-yellow/10 text-burnt-yellow"
                              )}
                              onClick={() => handleSetCampaignDefault(template.id)} 
                              disabled={isPending}
                            >
                              {template.isCampaignDefault ? "🎯 Desativar Campanha" : "🎯 Destacar Campanha"}
                            </Button>
                            <Button 
                              type="button" 
                              size="sm"
                              variant="outline"
                              className="flex-1 sm:flex-none h-9 font-black text-[10px] uppercase border-[#23323e] bg-[#0c131a] hover:bg-[#162330] hover:text-white text-zinc-300"
                              onClick={() => {
                                navigator.clipboard.writeText(template.body);
                                playCopySound();
                                setFeedback("Copiado!");
                                setTimeout(() => setFeedback(null), 2000);
                              }} 
                              disabled={isPending}
                            >
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              Copiar Fórmula
                            </Button>
                            <Button 
                              type="button" 
                              size="sm"
                              className="flex-1 sm:flex-none h-9 font-black text-[10px] uppercase bg-[#f0c15b] text-black hover:bg-[#d8a846] shadow-md border-transparent"
                              onClick={() => saveTemplate(template)} 
                              disabled={isPending}
                            >
                              Salvar Alterações
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-16 bg-[#090e12] border-t lg:border-t-0 lg:border-l border-[#23323e] flex lg:flex-col items-center justify-center gap-3 p-4 lg:p-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-xl"
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
