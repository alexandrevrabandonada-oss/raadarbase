"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type GuideAction = {
  id: string;
  title: string;
  topic: string;
  status: string;
};

export function PosBancaMobileGuide({ actions }: { actions: GuideAction[] }) {
  const [selectedActionId, setSelectedActionId] = useState(actions[0]?.id ?? "");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const selectedAction = actions.find((item) => item.id === selectedActionId) ?? null;

  const decisionText = selectedAction
    ? `Pos-banca: ${selectedAction.title}. Status atual: ${selectedAction.status}. Proxima decisao: revisar pendencias, validar devolutiva e fechar dossie com aprovacao humana.`
    : "Pos-banca: revisar pendencias, validar devolutiva e fechar dossie com aprovacao humana.";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#e2d7c4] bg-white p-4 shadow-sm">
        <label className="text-sm font-bold text-[#173a2d]" htmlFor="acao-pos-banca">1. Selecionar acao</label>
        <select
          id="acao-pos-banca"
          value={selectedActionId}
          onChange={(event) => setSelectedActionId(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-[#d9ccb8] bg-white px-4 text-base"
        >
          {actions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </section>

      <GuideBlock title="2. Resumo">{selectedAction ? `${selectedAction.title} • ${selectedAction.topic}` : "Nenhuma acao selecionada."}</GuideBlock>
      <GuideBlock title="3. Pendencias">Revise escutas abertas, devolutivas pendentes e validacoes manuais antes de fechar a rodada.</GuideBlock>
      <GuideBlock title="4. Temas">{selectedAction?.topic || "Sem tema principal definido."}</GuideBlock>
      <GuideBlock title="5. Territorios de referencia">Confirme os bairros e pontos coletivos usados na escuta antes de homologar o material.</GuideBlock>
      <GuideBlock title="6. Devolutiva">Cheque linguagem publica, ausencia de PII e coerencia com a pauta coletiva.</GuideBlock>
      <GuideBlock title="7. Dossie">Feche apenas quando houver sintese, evidencias e aprovacao humana.</GuideBlock>

      <section className="rounded-2xl border border-[#e2d7c4] bg-white p-4 shadow-sm">
        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-[#073d2b] text-base hover:bg-[#0b4d37]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(decisionText);
              setCopyFeedback("Decisao copiada.");
            } catch {
              setCopyFeedback("Nao foi possivel copiar agora.");
            }
          }}
        >
          Copiar decisao
        </Button>
        {copyFeedback ? <p className="mt-2 text-sm text-[#62736b]">{copyFeedback}</p> : null}
      </section>
    </div>
  );
}

function GuideBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e2d7c4] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6d3a]">{title}</p>
      <p className="mt-2 text-sm text-[#173a2d]">{children}</p>
    </section>
  );
}
