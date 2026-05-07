import Link from "next/link";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { getSilenceRadarData } from "@/lib/data/silence-radar";
import { listActionPlans } from "@/lib/data/action-plans";
import {
  getActiveCorrectiveActionKeys,
  correctiveActionDedupKey,
} from "@/lib/data/silence-radar-corrective-actions";
import {
  createNeighborhoodReinforcementItemAction,
  createTopicExplanationItemAction,
} from "./actions";
import { MapPin, MessageSquareX, TrendingUp, Eye, Lightbulb, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RadarSilenciosPage() {
  await requireInternalPageSession("/radar/silencios");
  await requireRole(["admin", "operador"]);

  const [radarData, activePlans, activeKeys] = await Promise.all([
    getSilenceRadarData(),
    listActionPlans({ status: "active" }),
    getActiveCorrectiveActionKeys(),
  ]);

  const defaultPlanId = radarData.activeWindowActionPlanId ?? activePlans[0]?.id ?? null;

  return (
    <AppShell>
      <PageHeader
        title="Radar de Silêncios"
        description="Identifica bairros, pautas e canais com baixa participação para evitar bolhas de engajamento e fortalecer a escuta territorial."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button nativeButton={false} variant="outline" render={<Link href="/escuta/bairro/admin" />}>
          Painel de escuta
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/acoes" />}>
          Planos de ação
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/escuta/bairro" />}>
          Formulário público
        </Button>
        <Button nativeButton={false} variant="secondary" render={<Link href="/radar/silencios/acoes" />}>
          Ver ações corretivas →
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/radar/silencios/impacto" />}>
          Ver impacto agregado
        </Button>
      </div>

      <Alert className="mb-8 border-amber-200 bg-amber-50/60">
        <AlertTitle>Escuta sem viés de seleção</AlertTitle>
        <AlertDescription>
          Este radar analisa apenas dados agregados por bairro, pauta e período — sem classificação individual, sem score, sem perfil. Sugestões são públicas e coletivas.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: Quiet neighborhoods */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <MapPin className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Bairros com poucos relatos</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {radarData.quietNeighborhoods.length} identificados
            </Badge>
          </CardHeader>
          <CardContent>
            {radarData.quietNeighborhoods.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum bairro com participação baixa na janela atual.
              </p>
            ) : (
              <div className="space-y-2">
                {radarData.quietNeighborhoods.map((n) => {
                  const dk = correctiveActionDedupKey("reforco_bairro", "bairro", n.bairro);
                  const hasAction = activeKeys.has(dk);
                  return (
                    <div key={n.bairro} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2">
                      <span className="text-sm font-medium">{n.bairro}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {n.reportCount} relato{n.reportCount !== 1 ? "s" : ""}
                        </span>
                        {hasAction ? (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs text-green-700 border-green-300">
                            <CheckCircle2 className="h-3 w-3" />
                            ação planejada
                          </Badge>
                        ) : defaultPlanId ? (
                          <div className="flex flex-col gap-1">
                            <form action={createNeighborhoodReinforcementItemAction}>
                              <input type="hidden" name="action_plan_id" value={defaultPlanId} />
                              <input type="hidden" name="bairro" value={n.bairro} />
                              <input type="hidden" name="baseline_count" value={n.reportCount} />
                              <Button type="submit" size="sm" variant="outline" className="h-7 w-full px-2 text-xs">
                                Criar tarefa
                              </Button>
                            </form>
                            <Button nativeButton={false} size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-primary" render={<Link href={`/campo/novo?neighborhood=${encodeURIComponent(n.bairro)}`} />}>
                              Ação de campo
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs font-medium text-blue-800">Sugestões públicas</p>
              <ul className="mt-1 space-y-1 text-xs text-blue-700">
                <li>• Reforçar chamada específica para o bairro</li>
                <li>• Criar card explicativo com link direto</li>
                <li>• Abrir roda de escuta presencial</li>
                <li>• Fazer pergunta pública sobre a realidade do bairro</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Low form topics */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <MessageSquareX className="h-5 w-5 text-red-500" />
            <CardTitle className="text-base">Pautas com muito comentário, pouco formulário</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {radarData.lowFormTopics.length} pautas
            </Badge>
          </CardHeader>
          <CardContent>
            {radarData.lowFormTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma pauta com disparidade significativa de engajamento.
              </p>
            ) : (
              <div className="space-y-2">
                {radarData.lowFormTopics.map((t) => {
                  const dk = correctiveActionDedupKey("explicacao_pauta", "pauta", t.topic);
                  const hasAction = activeKeys.has(dk);
                  return (
                    <div key={t.topic} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{t.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.commentCount} comentários · {t.formCount} relatos · ratio {t.engagementToFormRatio.toFixed(1)}×
                        </p>
                      </div>
                      {hasAction ? (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs text-green-700 border-green-300">
                          <CheckCircle2 className="h-3 w-3" />
                          ação planejada
                        </Badge>
                      ) : defaultPlanId ? (
                        <div className="flex flex-col gap-1">
                          <form action={createTopicExplanationItemAction}>
                            <input type="hidden" name="action_plan_id" value={defaultPlanId} />
                            <input type="hidden" name="topic" value={t.topic} />
                            <input type="hidden" name="kind" value="explicacao_pauta" />
                            <input type="hidden" name="baseline_form_count" value={t.formCount} />
                            <input type="hidden" name="baseline_comment_count" value={t.commentCount} />
                            <Button type="submit" size="sm" variant="outline" className="h-7 w-full px-2 text-xs">
                              Criar tarefa
                            </Button>
                          </form>
                          <Button nativeButton={false} size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-primary" render={<Link href={`/campo/novo?topicSlug=${encodeURIComponent(t.topic)}`} />}>
                            Ação de campo
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs font-medium text-blue-800">Sugestões públicas</p>
              <ul className="mt-1 space-y-1 text-xs text-blue-700">
                <li>• Explicar a pauta e como o formulário funciona</li>
                <li>• Fazer pergunta pública sobre a pauta</li>
                <li>• Criar link direto com pauta pré-selecionada</li>
                <li>• Abrir roda de escuta sobre a pauta</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: High engagement, low conversion posts */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">Posts com engajamento alto e baixa conversão</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {radarData.highEngagementPosts.length} posts
            </Badge>
          </CardHeader>
          <CardContent>
            {radarData.highEngagementPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum post com engajamento alto e score zero identificado.
              </p>
            ) : (
              <div className="space-y-2">
                {radarData.highEngagementPosts.map((p) => {
                  const dk = correctiveActionDedupKey("explicacao_pauta", "pauta", p.topic);
                  const hasAction = activeKeys.has(dk);
                  return (
                    <div key={p.id} className="rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{p.topic}</span>
                        <span className="text-xs text-muted-foreground">{p.interactions} interações</span>
                      </div>
                      {p.captionExcerpt ? (
                        <p className="mt-1 text-sm">{p.captionExcerpt}</p>
                      ) : (
                        <p className="mt-1 text-xs italic text-muted-foreground">Sem legenda</p>
                      )}
                      {hasAction ? (
                        <Badge variant="outline" className="mt-2 flex w-fit items-center gap-1 text-xs text-green-700 border-green-300">
                          <CheckCircle2 className="h-3 w-3" />
                          ação planejada para pauta
                        </Badge>
                      ) : defaultPlanId ? (
                        <form action={createTopicExplanationItemAction} className="mt-2">
                          <input type="hidden" name="action_plan_id" value={defaultPlanId} />
                          <input type="hidden" name="topic" value={p.topic} />
                          <input type="hidden" name="kind" value="explicacao_pauta" />
                          <input type="hidden" name="baseline_form_count" value={0} />
                          <input type="hidden" name="baseline_comment_count" value={p.interactions} />
                          <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Criar tarefa para pauta
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs font-medium text-blue-800">Sugestões públicas</p>
              <ul className="mt-1 space-y-1 text-xs text-blue-700">
                <li>• Adicionar link de escuta no comentário do post</li>
                <li>• Criar post de feed com chamada para relato</li>
                <li>• Fixar link na bio com pauta pré-selecionada</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Absent neighborhoods */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Eye className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-base">Bairros ausentes na janela territorial</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {radarData.absentNeighborhoods.length} ausentes
            </Badge>
          </CardHeader>
          <CardContent>
            {!radarData.activeWindowId ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma janela territorial ativa.{" "}
                <Link href="/escuta/bairro/admin" className="underline">
                  Abrir painel de escuta
                </Link>
                .
              </p>
            ) : radarData.absentNeighborhoods.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todos os bairros históricos participaram na janela atual.
              </p>
            ) : (
              <div className="space-y-2">
                {radarData.absentNeighborhoods.map((n) => {
                  const dk = correctiveActionDedupKey("reforco_bairro", "bairro", n.bairro);
                  const hasAction = activeKeys.has(dk);
                  return (
                    <div key={n.bairro} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{n.bairro}</p>
                        <p className="text-xs text-muted-foreground">
                          {n.totalHistoricReports} relato{n.totalHistoricReports !== 1 ? "s" : ""} históricos
                          {n.lastSeenAt
                            ? ` · último em ${new Date(n.lastSeenAt).toLocaleDateString("pt-BR")}`
                            : ""}
                        </p>
                      </div>
                      {hasAction ? (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs text-green-700 border-green-300">
                          <CheckCircle2 className="h-3 w-3" />
                          ação planejada
                        </Badge>
                      ) : defaultPlanId ? (
                        <form action={createNeighborhoodReinforcementItemAction}>
                          <input type="hidden" name="action_plan_id" value={defaultPlanId} />
                          <input type="hidden" name="bairro" value={n.bairro} />
                          <input type="hidden" name="baseline_count" value={0} />
                          <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs">
                            Criar tarefa
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs font-medium text-blue-800">Sugestões públicas</p>
              <ul className="mt-1 space-y-1 text-xs text-blue-700">
                <li>• Reforçar chamada com menção específica ao bairro</li>
                <li>• Abrir roda de escuta presencial no bairro</li>
                <li>• Abordagem coletiva — não individual</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions summary */}
      <Card className="mt-8 border-emerald-200 bg-emerald-50/30">
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <Lightbulb className="h-5 w-5 text-emerald-700" />
          <CardTitle className="text-base text-emerald-900">Sugestões de ação coletiva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Reforçar chamada por bairro", desc: "Publicação manual citando o bairro específico. Sem targeting individual." },
              { title: "Criar card explicativo", desc: "Material visual que explica a pauta e como participar pelo formulário de escuta." },
              { title: "Abrir roda de escuta", desc: "Evento presencial ou online para coletar relatos de forma coletiva." },
              { title: "Fazer pergunta pública", desc: "Post ou story com pergunta aberta sobre a pauta ou o bairro." },
            ].map((s) => (
              <div key={s.title} className="rounded-md border border-emerald-100 bg-white/70 p-3">
                <p className="text-sm font-medium text-emerald-900">{s.title}</p>
                <p className="mt-1 text-xs text-emerald-700">{s.desc}</p>
              </div>
            ))}
          </div>

          {!defaultPlanId ? (
            <Alert className="mt-4 border-amber-200 bg-amber-50/60">
              <AlertTitle className="text-sm">Nenhum plano de ação ativo</AlertTitle>
              <AlertDescription className="text-xs">
                Para criar tarefas a partir deste radar,{" "}
                <Link href="/acoes/novo" className="underline">
                  crie um plano de ação ativo
                </Link>
                .
              </AlertDescription>
            </Alert>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Tarefas criadas serão adicionadas ao plano.{" "}
              <Link href="/radar/silencios/acoes" className="underline">
                Ver ações corretivas →
              </Link>
              {" · "}
              <Link href="/radar/silencios/impacto" className="underline">
                Ver impacto agregado →
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Governance notice */}
      <div className="mt-6 rounded-md border border-slate-200 bg-slate-50/50 p-4">
        <p className="text-xs font-medium text-slate-700">Guardrails preservados</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "Sem score individual",
            "Sem classificação de pessoa",
            "Sem DM automática",
            "Sem microtargeting",
            "Apenas agregados",
            "Sem PII",
          ].map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">
              {g}
            </Badge>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
