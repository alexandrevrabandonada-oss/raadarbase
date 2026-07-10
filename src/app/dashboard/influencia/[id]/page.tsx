import Link from "next/link";
import { ArrowLeft, ExternalLink, History, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { getInfluenceProfile } from "@/lib/influence/data";
import { CATEGORY_LABELS } from "@/lib/influence/types";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { addInfluenceNote } from "./actions";

export const dynamic = "force-dynamic";

function formatNumber(value: number) { return new Intl.NumberFormat("pt-BR").format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }

export default async function InfluenceProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalPageSession(`/dashboard/influencia/${id}`);
  const detail = await getInfluenceProfile(id);
  if (!detail) notFound();
  const { profile, history, classifications, notes } = detail;
  const initials = (profile.nome || profile.username).split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return (
    <AppShell>
      <PageHeader eyebrow="Perfil de influência" title={profile.nome || `@${profile.username}`} description={`@${profile.username} · atualizado em ${formatDate(profile.data_ultima_atualizacao)}`} action={<Button variant="outline" nativeButton={false} render={<Link href="/dashboard/influencia" />}><ArrowLeft data-icon="inline-start" />Voltar</Button>} />
      <div className="grid gap-6 pb-12 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-cement bg-muted/20 text-xl font-black">{initials || <UserRound />}</div>
                <div className="min-w-0"><CardTitle className="flex flex-wrap items-center gap-2">{profile.nome || `@${profile.username}`}{profile.conta_verificada ? <ShieldCheck aria-label="Conta verificada" /> : null}</CardTitle><CardDescription>@{profile.username}</CardDescription><div className="mt-2 flex flex-wrap gap-2"><Badge>{CATEGORY_LABELS[profile.categoria]}</Badge>{profile.empresa ? <Badge variant="secondary">Empresa</Badge> : null}{profile.criador ? <Badge variant="secondary">Criador</Badge> : null}{profile.privada ? <Badge variant="outline">Privada na fonte</Badge> : null}</div></div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm leading-6">{profile.bio || "Bio não informada na fonte legítima."}</p>
              <div className="flex flex-wrap gap-4 text-sm"><span className="flex items-center gap-2"><MapPin />{profile.cidade ? `${profile.cidade}${profile.estado ? ` / ${profile.estado}` : ""}` : "Localização não inferida"}</span>{profile.site ? <a className="flex items-center gap-2 underline underline-offset-4" href={profile.site} target="_blank" rel="noreferrer"><ExternalLink />Site informado</a> : null}</div>
              <div className="grid gap-3 sm:grid-cols-4">{[["Seguidores", profile.seguidores], ["Seguindo", profile.seguindo], ["Posts", profile.posts], ["InfluenceScore", profile.influence_score]].map(([label, value]) => <div key={String(label)} className="rounded-[4px] border-2 border-cement p-3"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-mono text-xl font-black">{typeof value === "number" ? formatNumber(value) : value}</p></div>)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Score e evidências</CardTitle><CardDescription>Componentes configuráveis e inferências nunca preenchidas sem sinal observável.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><p className="text-sm font-black">InfluenceScore: {profile.influence_score.toFixed(2)}</p><pre className="mt-2 overflow-x-auto rounded-[4px] border-2 border-cement p-3 text-xs">{JSON.stringify(profile.score_components, null, 2)}</pre></div>
              <div><p className="text-sm font-black">Localização · confiança {(profile.location_confidence * 100).toFixed(0)}%</p><ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-sm">{Array.isArray(profile.location_evidence) && profile.location_evidence.length ? profile.location_evidence.map((evidence, index) => <li key={index}>{String(evidence)}</li>) : <li>Sem evidência suficiente; localização não atribuída.</li>}</ul></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History />Histórico</CardTitle><CardDescription>Snapshots anteriores preservados para auditoria.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-3">{history.length ? history.map((item) => <article key={item.id} className="rounded-[4px] border-2 border-cement p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.reason}</strong><time className="font-mono text-xs">{formatDate(item.created_at)}</time></div><p className="mt-2 text-sm text-muted-foreground">Campos: {item.changed_fields.join(", ") || "snapshot inicial"}</p></article>) : <p className="text-sm text-muted-foreground">Ainda não há alterações registradas.</p>}</CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Classificações</CardTitle><CardDescription>Regra, IA quando necessária, ou revisão manual.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-3"><div className="rounded-[4px] border-2 border-cement p-3"><strong>{CATEGORY_LABELS[profile.categoria]}</strong><p className="mt-1 text-xs text-muted-foreground">{profile.classification_source} · {(profile.classification_confidence * 100).toFixed(0)}% de confiança</p></div>{classifications.map((item) => <div key={item.id} className="border-l-2 border-cement pl-3 text-sm"><p>{item.categoria} · {(item.confidence * 100).toFixed(0)}%</p><p className="text-xs text-muted-foreground">{item.rationale || item.source} · {formatDate(item.created_at)}</p></div>)}</CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Observações</CardTitle><CardDescription>Anotações internas auditadas.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <form action={addInfluenceNote}><input type="hidden" name="profileId" value={profile.id} /><FieldGroup><Field><FieldLabel htmlFor="body">Nova observação</FieldLabel><Textarea id="body" name="body" maxLength={2000} required /><FieldDescription>Não registre dados sensíveis desnecessários.</FieldDescription></Field><Button type="submit">Salvar observação</Button></FieldGroup></form>
              <div className="flex flex-col gap-3">{notes.length ? notes.map((note) => <article key={note.id} className="rounded-[4px] border-2 border-cement p-3 text-sm"><p>{note.body}</p><p className="mt-2 text-xs text-muted-foreground">{note.created_by_email || "Usuário interno"} · {formatDate(note.created_at)}</p></article>) : <p className="text-sm text-muted-foreground">Nenhuma observação registrada.</p>}</div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
