"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Megaphone, MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  announcementPublicationChannels,
  emptyAnnouncementPublicationState,
  readAnnouncementPublicationState,
  type AnnouncementPublicationState,
} from "@/lib/announcement-publications";

export function AnnouncementSeasonProgress() {
  const [publications, setPublications] = useState<AnnouncementPublicationState>(emptyAnnouncementPublicationState);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPublications(readAnnouncementPublicationState());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const completedCount = Object.values(publications).filter(Boolean).length;
  const progress = (completedCount / announcementPublicationChannels.length) * 100;
  const announcementReady = completedCount === announcementPublicationChannels.length;
  const nextChannel = announcementPublicationChannels.find((channel) => !publications[channel.id]);
  const NextIcon = announcementReady ? MessagesSquare : Megaphone;

  return (
    <section className="radar-outline-card overflow-hidden border-2 border-charcoal bg-[#fff8ed] shadow-[4px_4px_0px_0px_rgba(17,32,42,0.14)]">
      <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center border-2 border-charcoal bg-burnt-yellow text-charcoal">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7759]">Temporada atual</p>
              <h2 className="text-2xl font-black tracking-tight text-charcoal">Anuncio da pre-candidatura</h2>
            </div>
          </div>

          <p className="max-w-3xl text-sm font-semibold leading-6 text-[#4b4337]">
            A primeira fase mede alcance publico antes de mobilizacao personalizada. Prepare a fala, publique nos canais abertos e organize apenas os retornos que chegarem.
          </p>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {announcementPublicationChannels.map((channel) => (
              <div
                key={channel.id}
                className="flex min-w-0 items-center gap-2 border-2 border-[#d8c7ac] bg-white/75 p-3 text-charcoal"
              >
                <CheckCircle2 className={publications[channel.id] ? "h-4 w-4 shrink-0 text-emerald-600" : "h-4 w-4 shrink-0 text-[#c6b292]"} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black">{channel.label}</span>
                  <span className="block truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b7759]">
                    {publications[channel.id] ? "Feito" : "Pendente"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between border-2 border-charcoal bg-charcoal p-4 text-off-white">
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-burnt-yellow">Publicacao inicial</p>
                <p className="mt-1 text-3xl font-black">{completedCount}/{announcementPublicationChannels.length}</p>
              </div>
              <NextIcon className="h-6 w-6 text-burnt-yellow" />
            </div>
            <Progress value={progress} className="mt-4 h-3 bg-white/15" indicatorClassName="bg-burnt-yellow" />
            <p className="mt-4 text-sm font-semibold leading-6 text-zinc-200">
              {announcementReady
                ? "Fala publica pronta. Agora acompanhe os retornos que pedem registro e resposta."
                : `Proximo marco: ${nextChannel?.label ?? "publicar o comunicado"} na central de anuncio.`}
            </p>
          </div>

          <Button
            className="mt-5 h-12 border-2 border-burnt-yellow bg-burnt-yellow text-xs font-black uppercase tracking-[0.16em] text-charcoal hover:bg-burnt-yellow/90"
            nativeButton={false}
            render={<Link href={announcementReady ? "/pessoas" : "/mensagens"} />}
          >
            {announcementReady ? "Ver retornos" : "Continuar anuncio"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
