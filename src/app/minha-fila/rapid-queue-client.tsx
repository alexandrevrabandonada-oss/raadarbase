"use client";

import { useCallback, useEffect, useState } from "react";
import { Instagram, LogOut, SkipForward, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOfflineTasks } from "@/lib/offline-queue";
import {
  getInstagramConfirmationCustodyIds,
  useInstagramSendReturn,
} from "@/hooks/use-instagram-send-return";
import type { MessageTemplate, PriorityPerson } from "@/lib/types";
import type { OutreachGoalStats } from "@/lib/data/outreach-goal";

type RapidQueueClientProps = {
  initialQueue: PriorityPerson[];
  templates: MessageTemplate[];
  outreachGoal: OutreachGoalStats | null;
};

export function RapidQueueClient({ initialQueue, templates, outreachGoal }: RapidQueueClientProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [messageByPerson, setMessageByPerson] = useState<Record<string, string>>({});

  const person = queue[index] ?? null;
  const message = person ? messageByPerson[person.id] ?? person.suggestedMessage ?? "" : "";

  const advance = useCallback((personId: string) => {
    setQueue((current) => current.filter((item) => item.id !== personId));
    setIndex((current) => Math.max(0, Math.min(current, queue.length - 2)));
  }, [queue.length]);

  const instagramSend = useInstagramSendReturn({
    onConfirmed: (confirmedPending) => advance(confirmedPending.personId),
  });

  useEffect(() => {
    let active = true;
    const custodyIds = getInstagramConfirmationCustodyIds();
    if (custodyIds.size > 0) {
      // Recibos são estado externo persistido e só podem ser restaurados após hidratar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueue((current) => current.filter((item) => !custodyIds.has(item.id)));
    }
    void getOfflineTasks().then((tasks) => {
      if (!active) return;
      const pendingConfirmationIds = new Set(
        tasks
          .filter((task) => task.action === "confirmDMSent")
          .map((task) => task.args[0]),
      );
      if (pendingConfirmationIds.size === 0) return;
      setQueue((current) => current.filter((item) => !pendingConfirmationIds.has(item.id)));
    });
    return () => {
      active = false;
    };
  }, []);

  const openInstagram = useCallback(async () => {
    if (!person || !message.trim() || instagramSend.phase !== "idle") return;
    await instagramSend.openInstagram({
      surface: "minha_fila",
      personId: person.id,
      templateId: person.suggestedTemplateId ?? null,
      username: person.username,
      message,
    });
  }, [instagramSend, message, person]);

  const skip = useCallback(() => {
    if (!person) return;
    setIndex((current) => Math.min(current + 1, queue.length - 1));
  }, [person, queue.length]);

  const progress = outreachGoal && outreachGoal.totalEligible > 0 ? Math.round((outreachGoal.totalSent / outreachGoal.totalEligible) * 100) : 0;
  const mural = outreachGoal?.operatorScores.slice(0, 8) ?? [];

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      {outreachGoal ? <><section className="grid grid-cols-2 gap-3">
        <div className="rounded-[4px] border-2 border-black bg-card p-3"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Enviadas</p><p className="mt-1 text-2xl font-black">{outreachGoal.totalSent.toLocaleString("pt-BR")}</p></div>
        <div className="rounded-[4px] border-2 border-black bg-card p-3"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Faltam</p><p className="mt-1 text-2xl font-black">{outreachGoal.totalRemaining.toLocaleString("pt-BR")}</p></div>
      </section>
      <div className="h-3 overflow-hidden rounded-[2px] border-2 border-black bg-card"><div className="h-full bg-burnt-yellow" style={{ width: `${progress}%` }} /></div></> : null}
      {!person ? (
        <section className="rounded-[4px] border-2 border-cement bg-card p-6 text-center"><p className="font-black">Esta parcela da fila terminou.</p><p className="mt-2 text-sm text-muted-foreground">{outreachGoal ? `Ainda faltam ${outreachGoal.totalRemaining.toLocaleString("pt-BR")} pessoas na base. ` : ""}Recarregue para buscar a próxima parcela.</p><Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>Carregar próxima parcela</Button></section>
      ) : <section className="rounded-[4px] border-2 border-black bg-card shadow-[4px_4px_0_0_#111]">
      <div className="border-b-2 border-black bg-charcoal p-5 text-off-white">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Próxima pessoa</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">{person.displayName || person.username}</h2>
        <p className="mt-1 font-bold text-off-white/80">@{person.username.replace(/^@+/, "")}</p>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground" htmlFor="rapid-message">Mensagem</label>
        {templates.length > 0 ? <select className="h-10 w-full rounded-[4px] border-2 border-input bg-background px-3 text-sm" defaultValue="" onChange={(event) => {
          const template = templates.find((item) => item.id === event.target.value);
          if (!template) return;
          setMessageByPerson((current) => ({ ...current, [person.id]: template.body.replaceAll("{username}", person.username.replace(/^@+/, "")) }));
        }}><option value="">Mensagem preparada</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select> : null}
        <textarea id="rapid-message" value={message} onChange={(event) => setMessageByPerson((current) => ({ ...current, [person.id]: event.target.value }))} className="min-h-44 w-full rounded-[4px] border-2 border-black bg-white p-4 text-sm leading-relaxed" />
        <Button data-testid="queue-send-instagram" size="lg" className="h-14 w-full bg-charcoal text-base font-black" onClick={openInstagram} disabled={!message.trim() || instagramSend.phase !== "idle"}>
          <Instagram data-icon="inline-start" />{instagramSend.phase === "idle" ? "Instagram" : "Aguardando retorno"}
        </Button>
        {instagramSend.pending ? <Button data-testid="queue-confirm-instagram-return" variant="outline" className="w-full" onClick={() => void (instagramSend.phase === "error" ? instagramSend.retryConfirmation() : instagramSend.confirmNow())}>{instagramSend.phase === "error" ? "Tentar registro novamente" : "Registrar envio e continuar"}</Button> : null}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={skip}><SkipForward data-icon="inline-start" />Pular</Button>
          <Button variant="ghost" onClick={() => window.location.assign("/dashboard")}><LogOut data-icon="inline-start" />Sair</Button>
        </div>
      </div>
      </section>}
      {outreachGoal ? <section className="rounded-[4px] border-2 border-black bg-charcoal p-4 text-white">
        <div className="mb-3 flex items-center gap-2"><Trophy className="size-4 text-burnt-yellow" /><div><p className="text-[10px] font-black uppercase tracking-wider text-burnt-yellow">Mural de envios</p><h2 className="font-black">Mensagens por voluntário</h2></div></div>
        <div className="space-y-2">{mural.length === 0 ? <p className="text-sm text-white/70">Nenhum envio registrado ainda.</p> : mural.map((operator, index) => <div key={operator.operatorId ?? operator.operatorEmail ?? index} className="rounded-[2px] border border-white/20 p-2"><div className="flex justify-between gap-3"><p className="truncate font-bold">{index + 1}. {operator.operatorName}</p><p className="font-black text-burnt-yellow">{operator.totalSent}</p></div><p className="text-[10px] uppercase text-white/60">Hoje: {operator.sentToday}</p></div>)}</div>
      </section> : null}
    </div>
  );
}
