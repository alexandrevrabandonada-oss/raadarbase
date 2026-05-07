import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VOLUNTEER_PERIODS, VOLUNTEER_SKILLS, VOLUNTEER_WEEKDAYS } from "@/lib/data/volunteers";
import { submitVolunteerApplicationAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PublicVolunteerApplicationPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error ? decodeURIComponent(resolvedSearchParams.error) : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase text-muted-foreground">Radar de Base</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Quer ajudar a organizar a escuta, as ações de rua, a comunicação ou os dados da campanha?</h1>
          <p className="mt-3 text-muted-foreground">Seu cadastro será revisado por uma pessoa da equipe antes de qualquer inclusão na base interna.</p>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTitle>Antes de enviar</AlertTitle>
          <AlertDescription>Isso não cria abordagem automática. Você pode não deixar contato. Não envie dados sensíveis.</AlertDescription>
        </Alert>

        {error ? (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTitle>Não foi possível enviar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Inscrição para revisão</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submitVolunteerApplicationAction} className="grid gap-5">
              <div className="hidden" aria-hidden="true">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de exibição</Label>
                  <Input id="displayName" name="displayName" required maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input id="neighborhood" name="neighborhood" maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" name="city" defaultValue="Volta Redonda" maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPreference">Preferência de contato</Label>
                  <select id="contactPreference" name="contactPreference" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="nenhum">Nenhum</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="telefone">Telefone</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email opcional</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" maxLength={160} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefone opcional</Label>
                  <Input id="contactPhone" name="contactPhone" maxLength={40} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Habilidades</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {VOLUNTEER_SKILLS.map((skill) => (
                      <label key={skill} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="skills" value={skill} />
                        {skill}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="space-y-2">
                  <Label htmlFor="interests">Interesses</Label>
                  <Textarea id="interests" name="interests" placeholder="Separe por vírgula ou linha" maxLength={600} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Dias disponíveis</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {VOLUNTEER_WEEKDAYS.map((day) => (
                      <label key={day} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="availabilityWeekdays" value={day} />
                        {day}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Períodos</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {VOLUNTEER_PERIODS.map((period) => (
                      <label key={period} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="availabilityPeriods" value={period} />
                        {period}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availabilityNotes">Observação de disponibilidade</Label>
                <Textarea id="availabilityNotes" name="availabilityNotes" maxLength={280} />
              </div>

              <div className="space-y-3 rounded-md border p-4">
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="consentToStoreData" required />
                  <span>Autorizo guardar estes dados para revisão da minha inscrição de voluntariado.</span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="consentToContact" />
                  <span>Autorizo contato humano da equipe pelo canal informado. Obrigatório se eu preencher contato.</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit">Enviar para revisão</Button>
                <Button nativeButton={false} variant="outline" render={<Link href="/recibo/escuta" />}>
                  Ver recibo público
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
