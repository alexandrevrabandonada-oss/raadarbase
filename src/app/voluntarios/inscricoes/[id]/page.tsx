import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { canManageContacts } from "@/lib/authz/roles";
import { getVolunteerApplication } from "@/lib/data/volunteer-applications";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import {
  approveVolunteerApplicationAction,
  archiveVolunteerApplicationAction,
  markVolunteerApplicationRetainedAction,
  redactVolunteerApplicationAction,
  rejectVolunteerApplicationAction,
  scheduleVolunteerApplicationRedactionAction,
  updateVolunteerApplicationReviewNotesAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function VolunteerApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireInternalPageSession(`/voluntarios/inscricoes/${id}`);
  const includeContact = canManageContacts(session.internalUser.role);
  const application = await getVolunteerApplication(id, { includeContact });
  if (!application) notFound();
  const canRedactNow = session.internalUser.role === "admin";
  const canManageRetention = session.internalUser.role === "admin" || session.internalUser.role === "operador";

  return (
    <AppShell>
      <PageHeader
        title={application.displayName}
        description="Detalhe da inscrição pública. A aprovação é uma decisão humana e auditada."
        action={<Button nativeButton={false} variant="outline" render={<Link href="/voluntarios/inscricoes" />}>Voltar</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Dados declarados</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div><strong>Status:</strong> <Badge variant="outline">{application.status}</Badge></div>
            <div><strong>Bairro:</strong> {application.neighborhood ?? "-"}</div>
            <div><strong>Cidade:</strong> {application.city ?? "-"}</div>
            <div><strong>Contato:</strong> {includeContact ? [application.contactEmail, application.contactPhone].filter(Boolean).join(" / ") || "Sem contato" : application.consentToContact ? "Oculto para este perfil" : "Sem contato consentido"}</div>
            <div><strong>Preferência:</strong> {application.contactPreference}</div>
            <div><strong>Consentiu contato:</strong> {application.consentToContact ? "sim" : "não"}</div>
            <div className="md:col-span-2"><strong>Habilidades:</strong> {application.skills.join(", ") || "-"}</div>
            <div className="md:col-span-2"><strong>Interesses:</strong> {application.interests.join(", ") || "-"}</div>
            <div className="md:col-span-2">
              <strong>Disponibilidade:</strong> {[...application.availability.weekdays, ...application.availability.periods, application.availability.notes ?? ""].filter(Boolean).join(" | ") || "-"}
            </div>
            {application.convertedVolunteerId ? (
              <div className="md:col-span-2">
                <Button nativeButton={false} variant="outline" render={<Link href={`/voluntarios/${application.convertedVolunteerId}`} />}>
                  Ver voluntário criado
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Revisão</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Revisado por:</strong> {application.reviewedByEmail ?? "-"}</p>
              <p><strong>Revisado em:</strong> {application.reviewedAt ? new Date(application.reviewedAt).toLocaleString("pt-BR") : "-"}</p>
              <p><strong>Notas:</strong> {application.reviewNotes ?? "-"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Retenção e privacidade</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <p><strong>Status de retenção:</strong> <Badge variant="outline">{application.retentionStatus}</Badge></p>
                <p><strong>Agendada para:</strong> {application.scheduledRedactionAt ? new Date(application.scheduledRedactionAt).toLocaleString("pt-BR") : "-"}</p>
                <p><strong>Anonimizada em:</strong> {application.redactedAt ? new Date(application.redactedAt).toLocaleString("pt-BR") : "-"}</p>
                <p><strong>Justificativa:</strong> {application.retentionReason ?? "-"}</p>
              </div>
              {canManageRetention ? (
                <div className="space-y-3">
                  <form action={scheduleVolunteerApplicationRedactionAction.bind(null, application.id)} className="space-y-2">
                    <Textarea name="reason" placeholder="Justificativa para agendar anonimização" required />
                    <Button type="submit" variant="outline" disabled={application.retentionStatus === "redacted" || application.retentionStatus === "retained"}>Agendar anonimização</Button>
                  </form>
                  <form action={markVolunteerApplicationRetainedAction.bind(null, application.id)} className="space-y-2">
                    <Textarea name="reason" placeholder="Justificativa para manter por necessidade operacional" required />
                    <Button type="submit" variant="outline" disabled={application.retentionStatus === "redacted"}>Marcar como retida</Button>
                  </form>
                  {canRedactNow ? (
                    <form action={redactVolunteerApplicationAction.bind(null, application.id)} className="space-y-2">
                      <Textarea name="reason" placeholder="Justificativa para anonimizar agora" required />
                      <Button type="submit" disabled={application.retentionStatus === "redacted" || application.retentionStatus === "retained"}>Anonimizar agora</Button>
                    </form>
                  ) : (
                    <p className="text-muted-foreground">Anonimização imediata exige perfil admin.</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Seu perfil permite apenas visualização desta seção.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ações humanas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form action={approveVolunteerApplicationAction.bind(null, application.id)} className="space-y-3">
                <Label htmlFor="volunteerStatus">Status inicial do voluntário</Label>
                <select id="volunteerStatus" name="volunteerStatus" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="novo">
                  <option value="novo">novo</option>
                  <option value="ativo">ativo</option>
                </select>
                <Textarea name="reviewNotes" placeholder="Nota interna opcional" defaultValue={application.reviewNotes ?? ""} />
                <Button type="submit" disabled={application.status !== "pending"}>Aprovar e criar voluntário</Button>
              </form>
              <form action={rejectVolunteerApplicationAction.bind(null, application.id)} className="space-y-3">
                <Textarea name="reviewNotes" placeholder="Motivo interno da rejeição" defaultValue={application.reviewNotes ?? ""} />
                <Button type="submit" variant="outline" disabled={application.status !== "pending"}>Rejeitar</Button>
              </form>
              <form action={archiveVolunteerApplicationAction.bind(null, application.id)}>
                <Button type="submit" variant="outline">Arquivar</Button>
              </form>
              <form action={updateVolunteerApplicationReviewNotesAction.bind(null, application.id)} className="space-y-3">
                <Textarea name="reviewNotes" placeholder="Atualizar nota de revisão" defaultValue={application.reviewNotes ?? ""} />
                <Button type="submit" variant="outline">Salvar nota</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
