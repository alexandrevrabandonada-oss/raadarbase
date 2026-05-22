import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  VOLUNTEER_PERIODS,
  VOLUNTEER_SKILLS,
  VOLUNTEER_WEEKDAYS,
  type CampaignVolunteer,
} from "@/lib/data/volunteers";

type VolunteerFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  cancelHref: string;
  defaults?: CampaignVolunteer;
  error?: string | null;
};

const skillLabels: Record<string, string> = {
  rua: "Rua",
  arte: "Arte",
  video: "Vídeo",
  texto: "Texto",
  dados: "Dados",
  formacao: "Formação",
  eventos: "Eventos",
  transporte: "Transporte",
  juridico: "Jurídico",
  saude: "Saúde",
  educacao: "Educação",
  outro: "Outro",
};

const weekdayLabels: Record<string, string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

const periodLabels: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  fim_de_semana: "Fim de semana",
};

export function VolunteerForm({ action, submitLabel, cancelHref, defaults, error }: VolunteerFormProps) {
  return (
    <form action={action} className="space-y-6">
      {error ? (
        <Alert className="border-red-200 bg-red-50/60">
          <AlertTitle>Não foi possível salvar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Alert className="border-blue-200 bg-blue-50/60">
        <AlertTitle>Consentimento explícito</AlertTitle>
        <AlertDescription>
          Este módulo é só para voluntários que quiseram ajudar explicitamente. Nenhum comentário ou interação do Instagram cria voluntário automaticamente.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="displayName">Nome de exibição</Label>
          <Input id="displayName" name="displayName" defaultValue={defaults?.displayName ?? ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" name="neighborhood" defaultValue={defaults?.neighborhood ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" name="city" defaultValue={defaults?.city ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">E-mail de contato</Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={defaults?.contactEmail ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPhone">Telefone de contato</Label>
          <Input id="contactPhone" name="contactPhone" defaultValue={defaults?.contactPhone ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPreference">Preferência de contato</Label>
          <select
            id="contactPreference"
            name="contactPreference"
            defaultValue={defaults?.contactPreference ?? "nenhum"}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="nenhum">Nenhum</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
            <option value="telefone">Telefone</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Origem</Label>
          <select
            id="source"
            name="source"
            defaultValue={defaults?.source ?? "formulario"}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="formulario">Formulário</option>
            <option value="evento_campo">Evento de campo</option>
            <option value="indicacao">Indicação</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Habilidades</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {VOLUNTEER_SKILLS.map((skill) => (
              <label key={skill} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <input type="checkbox" name="skills" value={skill} defaultChecked={defaults?.skills.includes(skill)} />
                {skillLabels[skill]}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Disponibilidade</Label>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Dias</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {VOLUNTEER_WEEKDAYS.map((day) => (
                  <label key={day} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <input type="checkbox" name="availabilityWeekdays" value={day} defaultChecked={defaults?.availability.weekdays.includes(day)} />
                    {weekdayLabels[day]}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Períodos</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {VOLUNTEER_PERIODS.map((period) => (
                  <label key={period} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <input type="checkbox" name="availabilityPeriods" value={period} defaultChecked={defaults?.availability.periods.includes(period)} />
                    {periodLabels[period]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <Textarea name="availabilityNotes" defaultValue={defaults?.availability.notes ?? ""} placeholder="Observações curtas sobre horários ou limitações." />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="interests">Interesses</Label>
          <Textarea
            id="interests"
            name="interests"
            defaultValue={defaults?.interests.join(", ") ?? ""}
            placeholder="Ex.: mutirão, comunicação, escuta territorial"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? "novo"}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="novo">Novo</option>
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>

        <div className="space-y-3 md:col-span-2">
          <label className="flex items-start gap-2 rounded-md border px-3 py-3 text-sm">
            <input type="checkbox" name="consentToStoreData" defaultChecked={defaults?.consentToStoreData ?? false} required />
            <span>Consentimento explícito para guardar estes dados internamente.</span>
          </label>
          <label className="flex items-start gap-2 rounded-md border px-3 py-3 text-sm">
            <input type="checkbox" name="consentToContact" defaultChecked={defaults?.consentToContact ?? false} />
            <span>Consentimento para contato opcional, apenas quando houver telefone ou e-mail informado.</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button nativeButton={false} variant="outline" render={<Link href={cancelHref} />}>
          Cancelar
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}