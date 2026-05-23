"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitNeighborhoodListenAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { playSynthConfirm, playSynthSuccess } from "@/lib/audio";
import { executeOrQueueAction } from "@/lib/offline-queue";

const TOPIC_OPTIONS = [
  { value: "saude", label: "Saude" },
  { value: "transporte", label: "Transporte" },
  { value: "poluicao", label: "Poluicao / CSN" },
  { value: "csn", label: "CSN" },
  { value: "outro", label: "Outro" },
] as const;

const RELATO_MAX_LENGTH = 320;

export function BairroListenForm({ sourceReportId, topicPreset }: { sourceReportId: string | null; topicPreset: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isQuickMode, setIsQuickMode] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(topicPreset ?? "");
  const [relato, setRelato] = useState("");
  const [wantsContact, setWantsContact] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [isOnline, setIsOnline] = useState(() => typeof window !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const shareMessage = "Contribua em 30 segundos: diga seu bairro + pauta + relato curto em /escuta/bairro";

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const consentToContact = formData.get("consent_to_contact") === "true" || formData.get("quer_contato") === "on";
        const consentimentoBasico = formData.get("consentimento_basico") === "on";

        const payload = {
          bairro: formData.get("bairro") as string,
          pauta: selectedTopic,
          relato_curto: relato,
          consent_to_contact: consentToContact,
          contato_opcional: formData.get("contato_opcional") as string || "",
          consentimento_basico: consentimentoBasico,
          consentimento_explicito: consentimentoBasico || formData.get("consentimento_explicito") === "on",
          aviso_privacidade_aceito: consentimentoBasico || formData.get("aviso_privacidade_aceito") === "on",
          source_report_id: sourceReportId,
        };

        startTransition(async () => {
          const result = await executeOrQueueAction("submitNeighborhoodListen", [payload], toast);
          setFeedback(
            result.ok
              ? {
                  type: "success",
                  text: result.offline
                    ? "Relato salvo offline 💾 Será enviado automaticamente quando a internet voltar."
                    : "Escuta registrada com sucesso.",
                }
              : { type: "error", text: result.error || "Falha ao registrar escuta." }
          );
          if (result.ok) {
            if (result.offline) {
              playSynthConfirm();
            } else {
              playSynthSuccess();
            }
            event.currentTarget.reset();
            setSelectedTopic(topicPreset ?? "");
            setRelato("");
            setWantsContact(false);
          }
        });
      }}
    >
      {!isOnline && (
        <div className="border-2 border-charcoal bg-burnt-yellow text-charcoal px-4 py-3 rounded-[2px] shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] flex items-center gap-3 animate-pulse">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-charcoal rounded-[2px] bg-charcoal text-burnt-yellow font-black text-sm">
            💾
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-black uppercase tracking-wider">Modo Offline Ativo</p>
            <p className="text-[11px] font-bold text-charcoal/90 leading-relaxed">
              Você está sem sinal, mas pode continuar coletando relatos. Suas escutas serão salvas localmente e sincronizadas assim que a internet voltar.
            </p>
          </div>
        </div>
      )}

      <input type="hidden" name="source_report_id" value={sourceReportId ?? ""} />
      {isQuickMode ? <input type="hidden" name="modo_relato" value="rapido" /> : <input type="hidden" name="modo_relato" value="completo" />}

      <div className="rounded-md border bg-muted/20 p-4">
        <p className="text-sm font-semibold">Escolha o modo</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsQuickMode(true)}
            className={isQuickMode ? "rounded-md border border-emerald-500 bg-emerald-50 px-3 py-2 text-left text-sm" : "rounded-md border px-3 py-2 text-left text-sm"}
          >
            <span className="block font-semibold">Responder em 30 segundos</span>
            <span className="text-xs text-muted-foreground">Fluxo minimo: bairro, pauta, relato curto e consentimento.</span>
          </button>
          <button
            type="button"
            onClick={() => setIsQuickMode(false)}
            className={!isQuickMode ? "rounded-md border border-emerald-500 bg-emerald-50 px-3 py-2 text-left text-sm" : "rounded-md border px-3 py-2 text-left text-sm"}
          >
            <span className="block font-semibold">Formulario completo</span>
            <span className="text-xs text-muted-foreground">Inclui aviso de privacidade detalhado e opcao de contato.</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Bairro" htmlFor="bairro">
          <Input id="bairro" name="bairro" placeholder="Ex.: Centro" required maxLength={120} />
        </Field>
        <Field label="Pauta" htmlFor="pauta">
          <input type="hidden" id="pauta" name="pauta" value={selectedTopic} required />
          <div className="flex flex-wrap gap-2">
            {TOPIC_OPTIONS.map((topic) => (
              <button
                key={topic.value}
                type="button"
                onClick={() => setSelectedTopic(topic.value)}
                className={selectedTopic === topic.value ? "rounded-full border border-emerald-500 bg-emerald-50 px-3 py-1 text-sm" : "rounded-full border px-3 py-1 text-sm"}
              >
                {topic.label}
              </button>
            ))}
          </div>
          {!selectedTopic ? <p className="text-xs text-muted-foreground">Selecione uma pauta rapida.</p> : null}
        </Field>
      </div>

      <Field label="Relato curto" htmlFor="relato_curto">
        <Textarea
          id="relato_curto"
          name="relato_curto"
          required
          maxLength={RELATO_MAX_LENGTH}
          className="min-h-28"
          value={relato}
          onChange={(event) => setRelato(event.target.value)}
          placeholder="Em poucas linhas, qual problema urgente precisa virar acao?"
        />
        <p className="text-xs text-muted-foreground">{relato.length}/{RELATO_MAX_LENGTH} caracteres</p>
      </Field>

      <div className="rounded-md border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-semibold">Contato opcional</p>
        <div className="flex items-start gap-3 text-sm">
          <input
            id="quero_contato"
            type="checkbox"
            name="consent_to_contact"
            value="true"
            checked={wantsContact}
            onChange={(event) => setWantsContact(event.target.checked)}
            className="mt-1"
          />
          <label htmlFor="quero_contato">Quero deixar contato para retorno</label>
        </div>

        {!wantsContact ? <input type="hidden" name="consent_to_contact" value="false" /> : null}

        {wantsContact ? (
          <Field label="Contato opcional" htmlFor="contato_opcional">
            <Input id="contato_opcional" name="contato_opcional" placeholder="WhatsApp, e-mail ou outra forma de retorno" maxLength={200} />
          </Field>
        ) : null}
      </div>

      {isQuickMode ? (
        <div className="space-y-3 rounded-md border p-4">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="consentimento_basico" required className="mt-1" />
            <span>Aceito participar da escuta publica por pauta e enviar apenas informacoes necessarias.</span>
          </label>
          <p className="text-xs text-muted-foreground">Privacidade: nao envie nome, telefone, e-mail, username ou relato sensivel.</p>
        </div>
      ) : (
        <div className="space-y-3 rounded-md border p-4">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="consentimento_explicito" required className="mt-1" />
            <span>Aceito participar da escuta publica por pauta, sem perfilamento individual.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="aviso_privacidade_aceito" required className="mt-1" />
            <span>Li o aviso de privacidade e nao vou enviar dados sensiveis desnecessarios.</span>
          </label>
        </div>
      )}

      {feedback ? (
        <p className={feedback.type === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700"}>
          {feedback.text}
        </p>
      ) : null}

      {feedback?.type === "success" ? (
        <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-sm font-semibold text-emerald-800">Relato enviado. Obrigado por fortalecer a escuta territorial.</p>
          <p className="text-xs text-emerald-900/80">Texto compartilhavel:</p>
          <div className="rounded-md border border-emerald-300/70 bg-white p-3 text-sm text-emerald-900">{shareMessage}</div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareMessage);
                  setCopyFeedback("Texto copiado.");
                } catch {
                  setCopyFeedback("Nao foi possivel copiar automaticamente.");
                }
              }}
            >
              Copiar texto
            </Button>
          </div>
          {copyFeedback ? <p className="text-xs text-emerald-900/80">{copyFeedback}</p> : null}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="h-12 w-full text-base font-semibold md:w-auto md:px-8">
        {isPending ? "Enviando..." : "Enviar relato rapido"}
      </Button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}