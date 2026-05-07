"use client";

import { useState, useTransition } from "react";
import { CalendarDays, MapPin, Save, ShieldCheck, UserRound } from "lucide-react";
import { submitNeighborhoodListenAction } from "@/app/escuta/bairro/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TOPIC_OPTIONS = [
  { value: "saude", label: "Saude" },
  { value: "transporte", label: "Transporte" },
  { value: "poluicao", label: "Poluicao / CSN" },
  { value: "csn", label: "CSN" },
  { value: "outro", label: "Outro" },
] as const;

const PROFILE_OPTIONS = ["morador", "feirante", "lideranca", "juventude", "trabalhador", "outro"] as const;
const STORAGE_KEY = "semear-mobile-listen-draft";
const SESSION_KEY = "semear-mobile-listen-counter";

type ActionOption = {
  id: string;
  title: string;
  neighborhood: string | null;
  startsAt: string | null;
};

type DraftState = {
  selectedActionId: string;
  interviewer: string;
  bairro: string;
  pauta: string;
  relatoCurto: string;
  territorioReferencia: string;
  perfilOpcional: string;
  querContato: boolean;
  contatoOpcional: string;
  observacoes: string;
};

const initialDraft: DraftState = {
  selectedActionId: "",
  interviewer: "",
  bairro: "",
  pauta: "outro",
  relatoCurto: "",
  territorioReferencia: "",
  perfilOpcional: "",
  querContato: false,
  contatoOpcional: "",
  observacoes: "",
};

export function MobileBatchListenForm({
  actionOptions,
  defaultInterviewer,
}: {
  actionOptions: ActionOption[];
  defaultInterviewer: string;
}) {
  const [draft, setDraft] = useState<DraftState>(() => {
    if (typeof window === "undefined") return { ...initialDraft, interviewer: defaultInterviewer };
    const savedDraft = window.localStorage.getItem(STORAGE_KEY);
    if (!savedDraft) return { ...initialDraft, interviewer: defaultInterviewer };

    try {
      const parsed = JSON.parse(savedDraft) as DraftState;
      return { ...parsed, interviewer: parsed.interviewer || defaultInterviewer };
    } catch {
      return { ...initialDraft, interviewer: defaultInterviewer };
    }
  });
  const [sessionCount, setSessionCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    const savedCounter = window.localStorage.getItem(SESSION_KEY);
    const parsed = Number(savedCounter);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAction = actionOptions.find((item) => item.id === draft.selectedActionId) ?? null;

  function updateDraft<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function persistDraft(nextState?: DraftState) {
    const payload = nextState ?? draft;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function clearListeningFields() {
    const nextState: DraftState = {
      ...draft,
      bairro: selectedAction?.neighborhood ?? draft.bairro,
      relatoCurto: "",
      territorioReferencia: "",
      perfilOpcional: "",
      querContato: false,
      contatoOpcional: "",
      observacoes: "",
    };
    setDraft(nextState);
    persistDraft(nextState);
  }

  function handleDraftSave() {
    persistDraft();
    setFeedback({ type: "success", text: "Rascunho salvo neste aparelho para continuar a sessao." });
  }

  return (
    <div className="space-y-5">
      <section className="sticky top-[4.8rem] z-20 rounded-2xl border border-[#e2d7c4] bg-white/95 p-4 shadow-sm backdrop-blur lg:top-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryPill
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            label="Acao selecionada"
            value={selectedAction?.title ?? "Escolha uma acao"}
          />
          <SummaryPill
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            label="Bairro da acao"
            value={selectedAction?.neighborhood ?? "Sem bairro definido"}
          />
          <SummaryPill
            icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
            label="Entrevistador"
            value={draft.interviewer || "Defina antes de digitar"}
          />
          <SummaryPill
            icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            label="Contador da sessao"
            value={`${sessionCount} ficha${sessionCount === 1 ? "" : "s"}`}
          />
        </div>
        <p className="mt-3 text-xs font-semibold text-[#51645b]">
          Privacidade: nao registre CPF, telefone, endereco ou dado sensivel. Contato so se houver consentimento.
        </p>
      </section>

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData();
          formData.set("bairro", draft.bairro.trim());
          formData.set("pauta", draft.pauta);
          formData.set("relato_curto", draft.relatoCurto.trim());
          formData.set("consentimento_basico", "true");
          formData.set("source_report_id", "");
          formData.set("consent_to_contact", draft.querContato ? "true" : "false");
          if (draft.querContato && draft.contatoOpcional.trim()) {
            formData.set("contato_opcional", draft.contatoOpcional.trim());
          }

          startTransition(async () => {
            const result = await submitNeighborhoodListenAction(formData);
            if (!result.ok) {
              setFeedback({ type: "error", text: result.error });
              return;
            }

            const nextCount = sessionCount + 1;
            window.localStorage.setItem(SESSION_KEY, String(nextCount));
            setSessionCount(nextCount);
            setFeedback({ type: "success", text: "Ficha salva. Voce pode seguir para a proxima." });
            clearListeningFields();
          });
        }}
      >
        <FormBlock title="1. Acao e sessao" description="Selecione primeiro a acao em campo e quem esta entrevistando.">
          <div className="space-y-2">
            <Label htmlFor="acao-sessao">Acao selecionada</Label>
            <select
              id="acao-sessao"
              value={draft.selectedActionId}
              onChange={(event) => {
                const selectedId = event.target.value;
                const action = actionOptions.find((item) => item.id === selectedId) ?? null;
                const nextState = {
                  ...draft,
                  selectedActionId: selectedId,
                  bairro: action?.neighborhood ?? draft.bairro,
                };
                setDraft(nextState);
                persistDraft(nextState);
              }}
              className="h-12 w-full rounded-xl border border-[#d9ccb8] bg-white px-4 text-base"
            >
              <option value="">Escolha uma acao recente</option>
              {actionOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} {item.neighborhood ? `- ${item.neighborhood}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Entrevistador" htmlFor="entrevistador">
              <Input
                id="entrevistador"
                value={draft.interviewer}
                onChange={(event) => updateDraft("interviewer", event.target.value)}
                onBlur={() => persistDraft()}
                className="h-12 text-base"
                placeholder="Nome ou e-mail da sessao"
              />
            </Field>
            <Field label="Data da sessao" htmlFor="data-sessao">
              <Input id="data-sessao" value={selectedAction?.startsAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)} readOnly className="h-12 text-base" />
            </Field>
          </div>
        </FormBlock>

        <FormBlock title="2. Fala / sintese" description="Registre apenas o essencial para leitura coletiva.">
          <Field label="Bairro" htmlFor="bairro">
            <Input
              id="bairro"
              value={draft.bairro}
              onChange={(event) => updateDraft("bairro", event.target.value)}
              onBlur={() => persistDraft()}
              className="h-12 text-base"
              placeholder="Ex.: Aterrado"
              required
            />
          </Field>
          <Field label="Relato curto" htmlFor="relato-curto">
            <Textarea
              id="relato-curto"
              value={draft.relatoCurto}
              onChange={(event) => updateDraft("relatoCurto", event.target.value)}
              onBlur={() => persistDraft()}
              className="min-h-36 text-base"
              placeholder="O que apareceu na conversa? Escreva em linguagem simples e sem dados sensiveis."
              required
            />
          </Field>
        </FormBlock>

        <FormBlock title="3. Territorio de referencia" description="Ajuda a revisao depois, sem mudar o schema atual.">
          <Field label="Territorio de referencia" htmlFor="territorio-referencia">
            <Input
              id="territorio-referencia"
              value={draft.territorioReferencia}
              onChange={(event) => updateDraft("territorioReferencia", event.target.value)}
              onBlur={() => persistDraft()}
              className="h-12 text-base"
              placeholder="Rua, feira, pracinha ou ponto coletivo"
            />
          </Field>
        </FormBlock>

        <FormBlock title="4. Perfil opcional" description="Nao registre dados sensiveis. Use apenas uma categoria ampla, se fizer sentido.">
          <div className="flex flex-wrap gap-2">
            {PROFILE_OPTIONS.map((profile) => (
              <button
                key={profile}
                type="button"
                onClick={() => {
                  const nextValue = draft.perfilOpcional === profile ? "" : profile;
                  updateDraft("perfilOpcional", nextValue);
                  window.requestAnimationFrame(() => persistDraft({ ...draft, perfilOpcional: nextValue }));
                }}
                className={draft.perfilOpcional === profile ? "rounded-full border border-[#0b5a3f] bg-[#e7f1e8] px-4 py-2 text-sm font-semibold text-[#0b5a3f]" : "rounded-full border border-[#d9ccb8] bg-white px-4 py-2 text-sm font-semibold text-[#41544c]"}
              >
                {profile}
              </button>
            ))}
          </div>
        </FormBlock>

        <FormBlock title="5. Temas" description="Escolha o tema principal para facilitar a revisao.">
          <div className="flex flex-wrap gap-2">
            {TOPIC_OPTIONS.map((topic) => (
              <button
                key={topic.value}
                type="button"
                onClick={() => {
                  updateDraft("pauta", topic.value);
                  window.requestAnimationFrame(() => persistDraft({ ...draft, pauta: topic.value }));
                }}
                className={draft.pauta === topic.value ? "rounded-full border border-[#0b5a3f] bg-[#0b5a3f] px-4 py-2 text-sm font-semibold text-white" : "rounded-full border border-[#d9ccb8] bg-white px-4 py-2 text-sm font-semibold text-[#41544c]"}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </FormBlock>

        <FormBlock title="6. Revisao / observacoes" description="Contato e observacoes operacionais ficam sob controle humano.">
          <label className="flex min-h-12 items-start gap-3 rounded-xl border border-[#e4d7c3] bg-[#fbf7ef] px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={draft.querContato}
              onChange={(event) => {
                const nextValue = event.target.checked;
                updateDraft("querContato", nextValue);
                window.requestAnimationFrame(() => persistDraft({ ...draft, querContato: nextValue }));
              }}
              className="mt-1 h-4 w-4"
            />
            <span>Esta pessoa quer deixar contato para retorno humano.</span>
          </label>
          {draft.querContato ? (
            <Field label="Contato opcional" htmlFor="contato-opcional">
              <Input
                id="contato-opcional"
                value={draft.contatoOpcional}
                onChange={(event) => updateDraft("contatoOpcional", event.target.value)}
                onBlur={() => persistDraft()}
                className="h-12 text-base"
                placeholder="WhatsApp ou e-mail, somente se houve consentimento"
              />
            </Field>
          ) : null}
          <Field label="Observacoes operacionais" htmlFor="observacoes-operacionais">
            <Textarea
              id="observacoes-operacionais"
              value={draft.observacoes}
              onChange={(event) => updateDraft("observacoes", event.target.value)}
              onBlur={() => persistDraft()}
              className="min-h-24 text-base"
              placeholder="Uso interno da sessao. Nao vira dado publico."
            />
          </Field>
        </FormBlock>

        {feedback ? (
          <div className={feedback.type === "error" ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"}>
            {feedback.text}
          </div>
        ) : null}

        <div className="sticky bottom-20 z-20 flex flex-col gap-3 rounded-2xl border border-[#e2d7c4] bg-white/96 p-4 shadow-lg backdrop-blur lg:bottom-4 lg:flex-row lg:justify-end">
          <Button type="button" variant="outline" onClick={handleDraftSave} className="h-12 rounded-xl text-base">
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            Salvar rascunho
          </Button>
          <Button type="submit" disabled={isPending} className="h-12 rounded-xl bg-[#073d2b] text-base font-bold hover:bg-[#0b4d37]">
            {isPending ? "Salvando..." : "Salvar e digitar proxima"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#e2d7c4] bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-black text-[#0b3326]">{title}</h2>
        <p className="mt-1 text-sm text-[#62736b]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-bold text-[#173a2d]">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SummaryPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#e9dece] bg-[#fffdf9] px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a6d3a]">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-[#0b3326]">{value}</p>
    </div>
  );
}
