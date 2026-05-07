"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Copy, ExternalLink, Flag, MessageCircle, ShieldCheck, User } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/app/actions";
import {
  createOutreachTask,
  markContactConfirmed,
  markDoNotContact,
  recordPersonReferral,
  recordPersonResponse,
  registerManualDm,
  updatePersonNotes,
  updatePersonReferralStatus,
  assumePersonResponsible,
} from "@/app/actions";
import { formatDateTime, statusLabels } from "@/lib/mock-data";
import { PERSON_RESPONSE_OPTIONS, type PersonOperationalProfile } from "@/lib/data/person-profile";
import type { FieldAgendaEvent } from "@/lib/data/field-agenda";
import type { PersonStatus, PersonReferral, PersonReferralType, PersonReferralStatus } from "@/lib/types";

function timelineBadgeClassName(type: PersonOperationalProfile["timeline"][number]["type"]) {
  switch (type) {
    case "instagram":
      return "border-sky-700/20 bg-sky-50 text-sky-950";
    case "tarefa":
      return "border-yellow-500/30 bg-yellow-100 text-yellow-950";
    default:
      return "border-zinc-500/30 bg-zinc-100 text-zinc-800";
  }
}

export function PersonActions({
  person,
  profile,
  availableEvents = [],
  referrals = [],
}: {
  person: PersonOperationalProfile["person"];
  profile: PersonOperationalProfile;
  availableEvents?: FieldAgendaEvent[];
  referrals?: PersonReferral[];
}) {
  const [status, setStatus] = useState<PersonStatus>(person.status);
  const [notes, setNotes] = useState(person.notes);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState<"mensagem" | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<PersonReferralType | "">("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [referralNotes, setReferralNotes] = useState("");

  const canApproach = status !== "nao_abordar" && !person.doNotContactReason;
  const nextActionLabel =
    status === "nao_abordar" || person.doNotContactReason
      ? `Não abordar: ${person.doNotContactReason ?? "pessoa pediu para não receber contato."}`
      : profile.priority.nextAction;

  async function copyMessage() {
    if (!profile.priority.suggestedMessage) return;
    await navigator.clipboard.writeText(profile.priority.suggestedMessage);
    setCopied("mensagem");
    setFeedback({ type: "success", text: "Mensagem sugerida copiada." });
    window.setTimeout(() => setCopied(null), 2000);
  }

  function applyResult(result: ActionResult, successText?: string, nextStatus?: PersonStatus) {
    if (result.ok) {
      if (nextStatus) setStatus(nextStatus);
      setFeedback({ type: "success", text: successText ?? result.message });
      return;
    }
    setFeedback({ type: "error", text: result.error });
  }

  function runAction(action: () => Promise<ActionResult>, options?: { successText?: string; nextStatus?: PersonStatus }) {
    startTransition(async () => {
      const result = await action();
      applyResult(result, options?.successText, options?.nextStatus);
    });
  }

  function saveNotes() {
    runAction(() => updatePersonNotes(person.id, notes), { successText: "Notas salvas." });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:col-span-2">
      <div className="space-y-6">
        <Card className="border-indigo-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Responsável pelo vínculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.priority.responsibleName ? (
              <p className="text-sm font-medium">{profile.priority.responsibleName}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Esta pessoa ainda não possui um responsável de equipe.</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-8"
                  onClick={() => runAction(() => assumePersonResponsible(person.id), { successText: "Você assumiu este vínculo." })}
                  disabled={isPending}
                >
                  Assumir Vínculo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-950/10">
          <CardHeader>
            <CardTitle>Próxima melhor ação</CardTitle>
            <CardDescription>Deixe a decisão operacional visível antes de abrir qualquer conversa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={profile.priority.temperature === "quente" ? "border-red-800/20 bg-red-50 text-red-950" : ""}>
                {profile.priority.temperature === "quente" ? "Prioridade Alta" : profile.priority.temperature === "morno" ? "Prioridade Média" : "Prioridade Baixa"}
              </Badge>
              <StatusBadge status={status} />
              {profile.priority.mainTheme ? <Badge variant="secondary">{profile.priority.mainTheme}</Badge> : null}
            </div>
            <div className="text-xl font-bold leading-snug text-primary">{nextActionLabel}</div>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-normal text-muted-foreground">Pode abordar?</div>
                <div>{canApproach ? "Sim, manualmente." : "Não."}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-normal text-muted-foreground">Última interação</div>
                <div>{profile.priority.latestInteractionLabel}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-normal text-muted-foreground">Status de abordagem</div>
                <div>{profile.priority.outreachStatusLabel}</div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              {profile.priority.riskFlags.doNotContact && (
                <Alert variant="destructive">
                  <AlertTitle>Não abordar!</AlertTitle>
                  <AlertDescription>
                    {person.doNotContactReason ?? "Esta pessoa pediu para não receber contato. Respeite a privacidade."}
                  </AlertDescription>
                </Alert>
              )}
              {profile.priority.riskFlags.noReferralAfterResponse && (
                <Alert className="border-amber-500/50 bg-amber-50 text-amber-900">
                  <AlertTitle>Falta Encaminhamento</AlertTitle>
                  <AlertDescription>
                    A pessoa respondeu mas ainda não foi encaminhada para nenhuma ação ou grupo.
                  </AlertDescription>
                </Alert>
              )}
              {profile.priority.riskFlags.recentOutreach && (
                <Alert className="border-blue-500/50 bg-blue-50 text-blue-900">
                  <AlertTitle>Contato Muito Recente</AlertTitle>
                  <AlertDescription>
                    Uma mensagem foi enviada há menos de 24 horas. Evite parecer spam.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por que está no radar?</CardTitle>
            <CardDescription>Explique a importância da pessoa com base em sinais públicos e registros operacionais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">{profile.priority.priorityReason}</div>
            <ul className="space-y-2 text-sm">
              {profile.reasons.map((reason) => (
                <li key={reason} className="rounded-md border bg-background px-3 py-2">
                  {reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagem sugerida</CardTitle>
            <CardDescription>Revise antes de enviar. Não mande em massa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{profile.compatibleTemplate?.name ?? "Sem template compatível"}</Badge>
              {profile.compatibleTemplate?.theme ? <Badge variant="secondary">{profile.compatibleTemplate.theme}</Badge> : null}
            </div>
            <div className="rounded-md border bg-background p-4 text-sm leading-relaxed">
              {profile.priority.suggestedMessage ?? "Ainda não há mensagem sugerida compatível para esta pessoa."}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={copyMessage} disabled={isPending || !profile.priority.suggestedMessage}>
                <Copy data-icon="inline-start" />
                {copied === "mensagem" ? "Mensagem copiada" : "Copiar mensagem"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de relação</CardTitle>
            <CardDescription>Interações, tarefas e registros manuais organizados em uma linha do tempo única.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.timeline.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Ainda não há histórico suficiente além do cadastro básico.
              </div>
            ) : (
              profile.timeline.map((item) => (
                <article key={item.id} className="rounded-md border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.title}</p>
                      {item.badge ? (
                        <Badge variant="outline" className={timelineBadgeClassName(item.type)}>
                          {item.badge}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.occurredAt)}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>O que a pessoa disse?</CardTitle>
            <CardDescription>Registre o resultado da conversa para manter a base atualizada.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {PERSON_RESPONSE_OPTIONS.map((option) => (
              <Button
                key={option.key}
                type="button"
                variant="outline"
                className="h-auto items-start justify-start py-3 text-left"
                disabled={isPending}
                onClick={() =>
                  runAction(() => recordPersonResponse(person.id, option.key), {
                    successText: `${option.label} registrado.`,
                    nextStatus:
                      option.key === "nao_quer_contato"
                        ? "nao_abordar"
                        : option.key === "nao_respondeu" || option.key === "revisar_depois"
                          ? "abordado"
                          : "respondeu",
                  })
                }
              >
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              render={<a href={`https://instagram.com/${person.username}`} target="_blank" rel="noreferrer" />}
            >
              <ExternalLink data-icon="inline-start" />
              Abrir Instagram
            </Button>
            <Button type="button" variant="outline" onClick={copyMessage} disabled={isPending || !profile.priority.suggestedMessage}>
              <Copy data-icon="inline-start" />
              Copiar mensagem
            </Button>
            <Button type="button" variant="outline" onClick={() => runAction(() => createOutreachTask(person.id))} disabled={isPending}>
              <Flag data-icon="inline-start" />
              Criar tarefa de abordagem
            </Button>
            <Button
              type="button"
              onClick={() => runAction(() => registerManualDm(person.id), { nextStatus: "abordado" })}
              disabled={isPending || !canApproach}
            >
              <MessageCircle data-icon="inline-start" />
              Registrar DM enviada
            </Button>
            <Button
              type="button"
              onClick={() => runAction(() => markContactConfirmed(person.id, "Instagram"), { nextStatus: "contato_confirmado" })}
              className="bg-emerald-900 text-white hover:bg-emerald-950"
              disabled={isPending || !canApproach}
            >
              <ShieldCheck data-icon="inline-start" />
              Marcar contato confirmado
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => runAction(() => markDoNotContact(person.id), { nextStatus: "nao_abordar" })}
              disabled={isPending}
            >
              Marcar como não abordar
            </Button>
            <div className="pt-2 border-t mt-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">Encaminhar para</label>
              <div className="grid gap-2">
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value as PersonReferralType)}
                >
                  <option value="">Selecione o destino...</option>
                  <option value="evento_campo">Evento / Ação de Campo</option>
                  <option value="voluntariado">Voluntariado</option>
                  <option value="grupo_lista">Grupo / Lista de Chamados</option>
                  <option value="missao_eluta">Missão ÉLuta</option>
                  <option value="missao_simples">Missão Simples Online</option>
                  <option value="revisar_depois">Revisar depois</option>
                  <option value="nao_abordar">Não abordar</option>
                </select>

                {selectedTarget === "evento_campo" && (
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="">Selecione o evento...</option>
                    {availableEvents.map(e => (
                      <option key={e.id} value={e.id}>{e.title} ({e.neighborhood || "Território"})</option>
                    ))}
                  </select>
                )}

                {selectedTarget && (
                  <>
                    <Textarea 
                      placeholder="Notas do encaminhamento..." 
                      className="text-xs min-h-[60px]"
                      value={referralNotes}
                      onChange={(e) => setReferralNotes(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      onClick={() => {
                        runAction(() => recordPersonReferral(person.id, selectedTarget as PersonReferralType, { 
                          targetId: selectedEventId, 
                          notes: referralNotes 
                        }), { successText: "Encaminhamento registrado." });
                        setSelectedTarget("");
                        setSelectedEventId("");
                        setReferralNotes("");
                      }}
                      disabled={isPending || (selectedTarget === "evento_campo" && !selectedEventId)}
                    >
                      Confirmar Encaminhamento
                    </Button>
                  </>
                )}
              </div>
            </div>

            {referrals.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">Encaminhamentos Ativos</label>
                <div className="space-y-3">
                  {referrals.map(ref => (
                    <div key={ref.id} className="rounded-md border p-3 text-xs bg-muted/20">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold uppercase">{ref.targetType.replace("_", " ")}</span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {ref.status}
                        </Badge>
                      </div>
                      {ref.targetId && (
                        <p className="text-muted-foreground mb-1">
                          Evento: {availableEvents.find(e => e.id === ref.targetId)?.title || "Carregando..."}
                        </p>
                      )}
                      {ref.notes && <p className="italic text-muted-foreground mb-2 line-clamp-2">&quot;{ref.notes}&quot;</p>}
                      
                      {ref.targetType === "missao_eluta" && ref.lastEventType && (
                        <div className="mb-2 p-2 rounded bg-indigo-50 border border-indigo-100 text-[10px]">
                          <p className="font-bold text-indigo-900 uppercase flex items-center gap-1">
                            Último evento Missão ÉLuta: {ref.lastEventType.replace("mission_eluta_", "").replace(/_/g, " ")}
                          </p>
                          <p className="text-indigo-700/70">
                            Em {formatDateTime(ref.lastEventAt || ref.updatedAt)} ({ref.lastEventSource === "webhook" ? "Via Webhook" : "Manual"})
                          </p>
                          {!!ref.metadata?.mission_slug && (
                            <p className="mt-1 font-medium">Missão: {String(ref.metadata.mission_slug)}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(ref.targetType === "missao_eluta" 
                          ? ["recebeu_link", "acessou", "fez_primeira_missao", "colaborador", "pode_puxar_missao"]
                          : ["convidado", "confirmou", "compareceu", "recusou"]
                        ).map(s => (
                          <Button 
                            key={s}
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[9px] uppercase"
                            onClick={() => runAction(() => updatePersonReferralStatus(ref.id, person.id, s as PersonReferralStatus))}
                            disabled={isPending}
                          >
                            {s.replace("_", " ")}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button nativeButton={false} variant="outline" render={<Link href="/campo" />}>
                Abrir Campo
              </Button>
              <Button nativeButton={false} variant="outline" render={<Link href="/voluntarios" />}>
                Abrir Voluntários
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas e cuidado da base</CardTitle>
            <CardDescription>Anote apenas o necessário para cuidar da relação. Não registre dados sensíveis ou inferências pessoais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              {profile.priority.mainTheme ? <Badge variant="secondary">{profile.priority.mainTheme}</Badge> : null}
              <Badge variant="outline">{statusLabels[status]}</Badge>
            </div>
            <Textarea
              className="min-h-40"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              aria-label="Notas internas"
            />
            <Button type="button" onClick={saveNotes} disabled={isPending}>
              Salvar notas
            </Button>
          </CardContent>
        </Card>

        {person.contact?.consent_status === "confirmed" ? (
          <div className="rounded-md border border-emerald-700/30 bg-emerald-50 p-4 text-sm text-emerald-950">
            Consentimento registrado para {person.contact.contact_channel}: {person.contact.consent_purpose}
          </div>
        ) : null}

        {feedback ? (
          <p className={`text-sm ${feedback.type === "error" ? "text-red-700" : "text-emerald-700"}`}>{feedback.text}</p>
        ) : null}
      </div>
    </div>
  );
}
