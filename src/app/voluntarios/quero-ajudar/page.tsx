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
        {/* Cabeçalho */}
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-cement">Radar de Base</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-charcoal">
            Quer ajudar na nossa organização de base?
          </h1>
          <p className="mt-3 text-cement text-sm">
            Seu cadastro passará por uma revisão interna de nossa equipe antes de qualquer inclusão ativa na base.
          </p>
        </div>

        {/* Alerta de Privacidade */}
        <Alert className="mb-6 border-2 border-black bg-[#FFF7CD] text-charcoal shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
          <AlertTitle className="font-black uppercase tracking-wider text-xs">Antes de enviar</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Esta inscrição não cria perfilamento automatizado nem abordagens automáticas. Você pode optar por não fornecer canais de contato.
          </AlertDescription>
        </Alert>

        {error ? (
          <Alert className="mb-6 border-2 border-black bg-rust/15 text-rust shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]">
            <AlertTitle className="font-black uppercase tracking-wider text-xs">Não foi possível enviar</AlertTitle>
            <AlertDescription className="text-xs mt-1">{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Card do Formulário */}
        <Card className="bloco-concreto">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-charcoal">Ficha de Inscrição para Revisão</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submitVolunteerApplicationAction} className="grid gap-5">
              <div className="hidden" aria-hidden="true">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              {/* Grid 1: Informações Gerais */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-wider text-cement">Nome de exibição</Label>
                  <Input id="displayName" name="displayName" required maxLength={120} className="border-2 border-black rounded-[2px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood" className="text-[10px] font-black uppercase tracking-wider text-cement">Bairro</Label>
                  <Input id="neighborhood" name="neighborhood" maxLength={120} className="border-2 border-black rounded-[2px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-wider text-cement">Cidade</Label>
                  <Input id="city" name="city" defaultValue="" maxLength={120} className="border-2 border-black rounded-[2px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPreference" className="text-[10px] font-black uppercase tracking-wider text-cement">Preferência de contato</Label>
                  <select 
                    id="contactPreference" 
                    name="contactPreference" 
                    className="h-10 w-full rounded-[2px] border-2 border-black bg-zinc-50 dark:bg-zinc-800 px-3 text-xs outline-none focus:ring-2 focus:ring-burnt-yellow"
                  >
                    <option value="nenhum">Nenhum</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="telefone">Telefone</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className="text-[10px] font-black uppercase tracking-wider text-cement">Email opcional</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" maxLength={160} className="border-2 border-black rounded-[2px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone" className="text-[10px] font-black uppercase tracking-wider text-cement">Telefone opcional</Label>
                  <Input id="contactPhone" name="contactPhone" maxLength={40} className="border-2 border-black rounded-[2px]" />
                </div>
              </div>

              {/* Grid 2: Habilidades & Interesses */}
              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2">
                  <legend className="text-[10px] font-black uppercase tracking-wider text-cement">Habilidades</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {VOLUNTEER_SKILLS.map((skill) => (
                      <label key={skill} className="flex items-center gap-2 text-xs font-bold text-charcoal dark:text-off-white cursor-pointer select-none">
                        <input type="checkbox" name="skills" value={skill} className="rounded-[2px] border-2 border-black accent-burnt-yellow size-4 cursor-pointer" />
                        {skill}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="space-y-1.5">
                  <Label htmlFor="interests" className="text-[10px] font-black uppercase tracking-wider text-cement">Áreas de Interesse / Anotações</Label>
                  <Textarea id="interests" name="interests" placeholder="Separe por vírgulas ou nova linha" maxLength={600} className="border-2 border-black rounded-[2px] min-h-[80px]" />
                </div>
              </div>

              {/* Grid 3: Disponibilidade */}
              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2">
                  <legend className="text-[10px] font-black uppercase tracking-wider text-cement">Dias disponíveis</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {VOLUNTEER_WEEKDAYS.map((day) => (
                      <label key={day} className="flex items-center gap-2 text-xs font-bold text-charcoal dark:text-off-white cursor-pointer select-none">
                        <input type="checkbox" name="availabilityWeekdays" value={day} className="rounded-[2px] border-2 border-black accent-burnt-yellow size-4 cursor-pointer" />
                        {day}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-[10px] font-black uppercase tracking-wider text-cement">Períodos</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {VOLUNTEER_PERIODS.map((period) => (
                      <label key={period} className="flex items-center gap-2 text-xs font-bold text-charcoal dark:text-off-white cursor-pointer select-none">
                        <input type="checkbox" name="availabilityPeriods" value={period} className="rounded-[2px] border-2 border-black accent-burnt-yellow size-4 cursor-pointer" />
                        {period}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="availabilityNotes" className="text-[10px] font-black uppercase tracking-wider text-cement">Detalhes sobre sua agenda (opcional)</Label>
                <Textarea id="availabilityNotes" name="availabilityNotes" maxLength={280} className="border-2 border-black rounded-[2px]" />
              </div>

              {/* Declaração de Consentimento */}
              <div className="space-y-3 rounded-[2px] border-2 border-black bg-zinc-50 dark:bg-zinc-800 p-4">
                <label className="flex items-start gap-2 text-xs font-bold text-charcoal dark:text-off-white cursor-pointer select-none">
                  <input type="checkbox" name="consentToStoreData" required className="rounded-[2px] border-2 border-black accent-burnt-yellow size-4 mt-0.5 cursor-pointer" />
                  <span>Autorizo guardar estes dados para revisão da minha inscrição de voluntariado.</span>
                </label>
                <label className="flex items-start gap-2 text-xs font-bold text-charcoal dark:text-off-white cursor-pointer select-none">
                  <input type="checkbox" name="consentToContact" className="rounded-[2px] border-2 border-black accent-burnt-yellow size-4 mt-0.5 cursor-pointer" />
                  <span>Autorizo contato humano da equipe pelo canal informado (obrigatório caso tenha preenchido dados de contato).</span>
                </label>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-3 mt-2">
                <Button type="submit" variant="default" className="rounded-[2px] border-black">
                  Enviar para revisão
                </Button>
                <Button nativeButton={false} variant="outline" render={<Link href="/recibo/escuta" />} className="rounded-[2px] border-black">
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
