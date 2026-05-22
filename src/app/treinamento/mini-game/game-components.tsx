import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  Instagram,
  Lock,
  MessageSquare,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Consequence, Mission, MissionHold, MissionStep, MissionSupportLevel } from "./game-data";

interface ActionButtonProps {
  active: boolean;
  disabled: boolean;
  done: boolean;
  icon: typeof Copy;
  label: string;
  onClick: () => void;
}

export function ActionButton({ active, disabled, done, icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-auto min-h-20 rounded-[2px] border-2 px-3 py-4 text-xs font-black uppercase tracking-widest",
        active && "border-charcoal bg-burnt-yellow text-charcoal hover:bg-burnt-yellow/90",
        done && "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-600",
        !active && !done && "border-charcoal/30 bg-cement/20 text-charcoal disabled:opacity-45 dark:text-off-white",
      )}
    >
      {done ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <Icon className="mr-2 h-5 w-5" />}
      {label}
    </Button>
  );
}

export function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-charcoal bg-off-white p-3 dark:border-cement dark:bg-[#1E1E1B]">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7E7E70]">{label}</p>
      <p className="mt-1 text-xl font-black leading-none">{value}</p>
    </div>
  );
}

export function ConsequencePanel({ consequence }: { consequence: Consequence }) {
  return (
    <div
      aria-live={consequence.tone === "guardrail" ? "assertive" : "polite"}
      aria-atomic="true"
      role={consequence.tone === "guardrail" ? "alert" : "status"}
      className={cn(
        "border-2 p-4",
        consequence.tone === "clear" && "border-moss bg-moss/10",
        consequence.tone === "warning" && "border-dark-yellow bg-burnt-yellow/15",
        consequence.tone === "guardrail" && "border-rust bg-rust/10",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border-2",
            consequence.tone === "clear" && "border-moss text-moss",
            consequence.tone === "warning" && "border-dark-yellow text-dark-yellow",
            consequence.tone === "guardrail" && "border-rust text-rust",
          )}
        >
          {consequence.tone === "clear" ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em]">{consequence.eyebrow}</p>
          <p className="mt-1 text-sm font-black uppercase tracking-widest">{consequence.label}</p>
          <p className="mt-2 text-xs font-semibold leading-relaxed">{consequence.message}</p>
        </div>
      </div>
    </div>
  );
}

export function MissionHoldPanel({ hold }: { hold: MissionHold }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className={cn(
        "border-2 p-4",
        hold.tone === "free" && "border-moss bg-moss/10 text-moss",
        hold.tone === "waiting" && "border-dark-yellow bg-burnt-yellow/15 text-dark-yellow",
        hold.tone === "blocked" && "border-rust bg-rust/10 text-rust",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border-2 border-current">
          {hold.tone === "free" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : hold.tone === "waiting" ? (
            <Lock className="h-5 w-5" />
          ) : (
            <ShieldAlert className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em]">Estado operacional</p>
          <p className="mt-1 text-sm font-black uppercase tracking-widest">{hold.label}</p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-charcoal/75 dark:text-off-white/75">
            {hold.message}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ConversationSimulatorProps {
  completedSteps: MissionStep[];
  currentStepIndex: number;
  draftMessage: string;
  mission: Mission;
  supportLevel: MissionSupportLevel;
  onConfirmPersonalization: () => void;
  onDraftChange: (message: string) => void;
  step: MissionStep;
}

export function ConversationSimulator({
  completedSteps,
  currentStepIndex,
  draftMessage,
  mission,
  supportLevel,
  onConfirmPersonalization,
  onDraftChange,
  step,
}: ConversationSimulatorProps) {
  const channelOpen = completedSteps.includes("open");
  const sent = completedSteps.includes("send");
  const personalized = completedSteps.includes("personalize");

  return (
    <div
      className={cn(
        "border-2 p-4",
        currentStepIndex >= 2 ? "border-charcoal dark:border-cement" : "border-charcoal/20 opacity-70 dark:border-cement/30",
        step === "personalize" && supportLevel === "guided" && "shadow-[4px_4px_0_0_rgba(242,169,0,0.45)]",
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-widest">Canal simulado</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[#7E7E70]">
            {channelOpen
              ? `${mission.channelLabel} aberto para registro manual`
              : `Abra ${mission.channelLabel.toLowerCase()} para entrar no fluxo`}
          </p>
        </div>
        <span className="border border-charcoal bg-burnt-yellow/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest dark:border-cement">
          {supportLevel === "guided"
            ? "Tutorial: envie no canal"
            : supportLevel === "assisted"
              ? personalized ? "Pronto para envio" : "Decida o ajuste"
              : personalized ? "Mensagem revista" : "Leia o contexto"}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="border-2 border-charcoal bg-off-white p-4 dark:border-cement dark:bg-[#121210]">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-burnt-yellow" />
            <p className="text-xs font-black uppercase tracking-widest">Modelo sugerido</p>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-charcoal/80 dark:text-off-white/80">
            {mission.suggestedMessage}
          </p>
        </div>

        <div className="border-2 border-charcoal bg-[#111] text-off-white dark:border-cement">
          <div className="flex items-center justify-between border-b border-off-white/20 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-burnt-yellow text-xs font-black text-burnt-yellow">
                {mission.contact.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{mission.contact}</p>
                <p className="truncate text-[11px] font-bold text-off-white/55">{mission.handle}</p>
              </div>
            </div>
            <ChannelGlyph channel={mission.channel} open={channelOpen} />
          </div>

          <div className="space-y-3 bg-[#171715] p-4">
            <div className="max-w-[88%] border border-off-white/20 bg-off-white/10 p-3 text-xs font-semibold leading-relaxed">
              {mission.signal}
            </div>

            {!channelOpen && (
              <div className="flex min-h-28 items-center justify-center border border-dashed border-off-white/25 px-4 text-center text-xs font-black uppercase tracking-widest text-off-white/45">
                Conversa bloqueada ate abrir o canal
              </div>
            )}

            {channelOpen && !sent && (
              <div className="ml-auto w-full max-w-[94%] border border-burnt-yellow/60 bg-burnt-yellow/10 p-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-burnt-yellow">Sua mensagem manual</p>
                <Textarea
                  aria-label={`Personalizar mensagem para ${mission.contact}`}
                  value={draftMessage}
                  onChange={(event) => onDraftChange(event.target.value)}
                  disabled={step !== "personalize"}
                  className="min-h-32 rounded-[2px] border-2 border-charcoal bg-off-white text-sm font-semibold leading-relaxed text-charcoal disabled:opacity-80"
                />
              </div>
            )}

            {sent && (
              <>
                <div className="ml-auto max-w-[94%] border-2 border-burnt-yellow bg-burnt-yellow p-3 text-sm font-semibold leading-relaxed text-charcoal">
                  {draftMessage}
                </div>
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="max-w-[88%] border border-off-white/20 bg-off-white/10 p-3"
                >
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-off-white/55">Resposta recebida</p>
                  <p className="text-sm font-semibold leading-relaxed">{mission.simulatedReply}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold leading-relaxed text-charcoal/65 dark:text-off-white/65">
          {supportLevel === "operation"
            ? sent
              ? "Retorno recebido. Registre o estado real da conversa."
              : personalized
                ? "Mensagem revista. Confirme o envio manual."
                : "Personalize o modelo sem perder o contexto."
            : sent
              ? "O envio manual foi confirmado. Leia o retorno recebido e registre o estado da conversa."
              : personalized
                ? "A personalizacao foi validada. Confirme o envio no botao operacional acima."
                : "Mantenha o contexto, personalize uma frase e confirme o envio apenas depois."}
        </p>
        {step === "personalize" ? (
          <Button
            type="button"
            onClick={onConfirmPersonalization}
            className="h-11 rounded-[2px] border-2 border-charcoal bg-burnt-yellow text-xs font-black uppercase tracking-widest text-charcoal hover:bg-burnt-yellow/90"
          >
            Validar personalizacao
          </Button>
        ) : (
          <span className="inline-flex min-h-11 items-center justify-center border-2 border-moss bg-moss/10 px-3 text-[10px] font-black uppercase tracking-widest text-moss">
            {sent ? "Envio confirmado" : personalized ? "Personalizacao validada" : "Canal aguardando"}
          </span>
        )}
      </div>
    </div>
  );
}

function ChannelGlyph({ channel, open }: { channel: Mission["channel"]; open: boolean }) {
  const iconClassName = cn("h-5 w-5", open ? "text-burnt-yellow" : "text-off-white/35");

  if (channel === "field-note") return <ClipboardCheck className={iconClassName} />;
  if (channel === "form") return <FileText className={iconClassName} />;
  return <Instagram className={iconClassName} />;
}

interface MissionReceiptProps {
  corrections: number;
  finalMission: boolean;
  memory: string;
  mission: Mission;
  onContinue: () => void;
  registeredResponse: string | null;
  route: Mission["routeOptions"][number];
  routeHold: MissionHold;
}

export function MissionReceipt({
  corrections,
  finalMission,
  memory,
  mission,
  onContinue,
  registeredResponse,
  route,
  routeHold,
}: MissionReceiptProps) {
  return (
    <div
      aria-label={`Recibo da missao de ${mission.contact}`}
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="border-4 border-charcoal bg-[#111] p-4 text-off-white shadow-[5px_5px_0_0_rgba(26,26,26,0.35)] dark:border-cement md:p-5"
    >
      <div className="flex flex-col gap-4 border-b border-off-white/20 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-burnt-yellow">Recibo da missao</p>
          <h4 className="mt-2 text-2xl font-black uppercase">Registro consolidado</h4>
        </div>
        <div className="flex items-center gap-2 border-2 border-burnt-yellow bg-burnt-yellow/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-burnt-yellow">
          <RouteGlyph icon={route.icon} />
          {route.label}
        </div>
      </div>

      <div className="grid gap-3 py-4 md:grid-cols-5">
        <ReceiptField label="Contato" value={mission.contact} />
        <ReceiptField label="Resposta registrada" value={registeredResponse || "Registro pendente"} />
        <ReceiptField label="Destino" value={route.label} />
        <ReceiptField label="Estado" value={routeHold.label} />
        <ReceiptField label="Correcoes" value={corrections === 0 ? "Fluxo limpo" : `${corrections}`} />
      </div>

      <div className="border-t border-off-white/20 pt-4">
        <div className="mb-3 border-2 border-off-white/20 bg-off-white/5 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Memoria curta</p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-off-white/85">{memory}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-off-white/45">
            Apenas contexto necessario. Sem dado sensivel extra.
          </p>
        </div>
        <div
          className={cn(
            "border-2 p-3",
            routeHold.tone === "free" && "border-emerald-400 bg-emerald-400/10",
            routeHold.tone === "waiting" && "border-burnt-yellow bg-burnt-yellow/10",
            routeHold.tone === "blocked" && "border-rust bg-rust/10",
          )}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Estado salvo</p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-off-white/75">{routeHold.message}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-off-white/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs font-semibold leading-relaxed text-off-white/70">
          {route.feedback} O proximo operador recebe o contexto, a resposta e a rota escolhida.
          {corrections > 0 ? ` Esta missao exigiu ${corrections} correcao.` : ""}
        </p>
        <Button
          type="button"
          onClick={onContinue}
          className="h-12 rounded-[2px] border-2 border-charcoal bg-burnt-yellow px-5 text-xs font-black uppercase tracking-widest text-charcoal hover:bg-burnt-yellow/90"
        >
          {finalMission ? "Concluir trilha" : "Proxima missao"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RouteGlyph({ icon }: { icon: Mission["routeOptions"][number]["icon"] }) {
  if (icon === "shield") return <ShieldAlert className="h-4 w-4" />;
  if (icon === "wait") return <Lock className="h-4 w-4" />;
  return <UserCheck className="h-4 w-4" />;
}

function ReceiptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-off-white/20 bg-off-white/5 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">{label}</p>
      <p className="mt-2 text-sm font-black uppercase tracking-widest">{value}</p>
    </div>
  );
}

export function StepResolution({
  label,
  message,
  value,
}: {
  label: string;
  message: string;
  value: string;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="flex flex-col gap-3 border-2 border-moss bg-moss/10 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-moss">{label}</p>
        <p className="mt-1 text-sm font-black uppercase tracking-widest">{value}</p>
      </div>
      <p className="max-w-sm text-xs font-semibold leading-relaxed text-charcoal/70 dark:text-off-white/70">
        {message}
      </p>
    </div>
  );
}

export function MissionMemoryPreview({ memory }: { memory: string }) {
  return (
    <div className="border-2 border-charcoal bg-off-white p-4 text-charcoal dark:border-cement dark:bg-[#121210] dark:text-off-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">Memoria curta</p>
        <span className="border border-charcoal px-2 py-1 text-[10px] font-black uppercase tracking-widest dark:border-cement">
          Registro privado
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-relaxed">{memory}</p>
      <p className="mt-3 text-xs font-semibold leading-relaxed text-charcoal/60 dark:text-off-white/60">
        Esta nota preserva o que o proximo operador precisa saber sem ampliar o cadastro.
      </p>
    </div>
  );
}
