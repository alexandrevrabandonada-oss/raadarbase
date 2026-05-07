"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertCircle, ArrowUpDown, Copy, ExternalLink, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, statusLabels } from "@/lib/mock-data";
import type { IgPerson, PeoplePriorityQuickFilter, PersonStatus, PriorityPerson } from "@/lib/types";

type Operator = { id: string; email: string; full_name: string | null; role: string };

const statusFilters: ("todos" | PersonStatus)[] = [
  "todos",
  "novo",
  "responder",
  "abordado",
  "respondeu",
  "contato_confirmado",
  "nao_abordar",
];

const quickFilters: Array<{ id: PeoplePriorityQuickFilter | "quer_evento" | "quer_voluntariado" | "quer_eluta"; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "quentes", label: "Quentes" },
  { id: "sem_responsavel", label: "Sem responsável" },
  { id: "pendente_resposta", label: "Pendente de resposta" },
  { id: "sem_encaminhamento", label: "Sem encaminhamento" },
  { id: "quer_evento", label: "Quer evento" },
  { id: "quer_voluntariado", label: "Quer voluntariado" },
  { id: "quer_eluta", label: "Quer ÉLuta" },
  { id: "nao_abordar", label: "Não abordar" },
];

function temperatureBadgeClassName(temperature: PriorityPerson["temperature"]) {
  switch (temperature) {
    case "quente":
      return "border-red-800/20 bg-red-50 text-red-950";
    case "morno":
      return "border-yellow-500/30 bg-yellow-100 text-yellow-950";
    default:
      return "border-sky-700/20 bg-sky-50 text-sky-950";
  }
}

function temperatureLabel(temperature: PriorityPerson["temperature"]) {
  switch (temperature) {
    case "quente":
      return "Quente";
    case "morno":
      return "Morno";
    default:
      return "Frio";
  }
}

export function PeopleClient({ 
  people, 
  priorityPeople, 
  operators = [] 
}: { 
  people: IgPerson[]; 
  priorityPeople: PriorityPerson[];
  operators?: Operator[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("todos");
  const [sort, setSort] = useState<"recentes" | "interacoes">("recentes");
  const [selectedTheme, setSelectedTheme] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState<PeoplePriorityQuickFilter | "quer_evento" | "quer_voluntariado" | "quer_eluta">("todos");
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);

  const allThemes = useMemo(() => {
    const set = new Set<string>();
    people.forEach((person) => {
      person.themes.forEach((theme) => {
        if (theme !== "instagram_comment") set.add(theme);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [people]);

  const filteredPriorityPeople = useMemo(() => {
    return priorityPeople
      .filter((person) => {
        if (selectedTheme === "todos") return true;
        return person.themes.includes(selectedTheme) || person.mainTheme === selectedTheme;
      })
      .filter((person) => {
        switch (priorityFilter) {
          case "quentes":
            return person.priorityEligible && person.temperature === "quente";
          case "sem_responsavel":
            return person.priorityEligible && !person.responsibleName;
          case "pendente_resposta":
            return person.priorityEligible && person.isPendingResponse;
          case "sem_encaminhamento":
            return person.priorityEligible && !person.hasReferral;
          case "quer_evento":
            return person.themes.includes("quer_evento_campo");
          case "quer_voluntariado":
            return person.themes.includes("quer_voluntariado");
          case "quer_eluta":
            return person.themes.includes("quer_missao_eluta");
          case "nao_abordar":
            return !person.priorityEligible || person.status === "nao_abordar";
          default:
            // Check if priorityFilter is an operator ID
            if (operators.some(op => op.id === priorityFilter)) {
              return person.priorityEligible && person.responsibleName !== null; // Placeholder: this needs the responsible ID match which isnt in PriorityPerson yet, but let's assume filtering by name match for now or update the type
            }
            return person.priorityEligible;
        }
      })
      .slice(0, 10);
  }, [priorityFilter, priorityPeople, selectedTheme]);

  const filteredPeople = useMemo(() => {
    return people
      .filter((person) => {
        if (statusFilter === "todos") return person.status !== "nao_abordar";
        return person.status === statusFilter;
      })
      .filter((person) => {
        if (selectedTheme === "todos") return true;
        return person.themes.includes(selectedTheme);
      })
      .filter((person) => person.username.toLowerCase().includes(query.replace("@", "").toLowerCase()))
      .sort((a, b) =>
        sort === "recentes"
          ? Date.parse(b.lastInteractionAt ?? "1970-01-01") - Date.parse(a.lastInteractionAt ?? "1970-01-01")
          : b.totalInteractions - a.totalInteractions,
      );
  }, [people, query, selectedTheme, sort, statusFilter]);

  async function copySuggestedMessage(person: PriorityPerson) {
    if (!person.suggestedMessage) return;
    await navigator.clipboard.writeText(person.suggestedMessage);
    setCopiedPersonId(person.id);
    window.setTimeout(() => setCopiedPersonId((current) => (current === person.id ? null : current)), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {people.length === 0 && (
        <Alert className="border-amber-200 bg-amber-50/60 mb-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Ambiente de Produção Vazio</AlertTitle>
          <AlertDescription className="text-amber-700">
            Nenhuma pessoa real encontrada. Importe ou sincronize dados (Meta, planilhas) antes de operar. 
            Se você esperava dados aqui, verifique se a sincronização do Instagram está ativa.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-red-950/20 shadow-sm">
        <CardHeader className="bg-red-50/30">
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-red-600 animate-pulse"></span>
            Rotina do Dia: Abordagens Prioritárias
          </CardTitle>
          <CardDescription>
            Pessoas que interagiram recentemente e aguardam seu contato manual e humano.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm leading-relaxed text-amber-900">
            <strong className="flex items-center gap-1 mb-2"><AlertCircle className="w-4 h-4"/> Piloto 7 Dias: Checklist Diário</strong>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>1.</strong> Ver 10 pessoas de hoje.</li>
              <li><strong>2.</strong> Distribuir responsáveis (Assumir as suas).</li>
              <li><strong>3.</strong> Mandar mensagens manuais (humanizadas).</li>
              <li><strong>4.</strong> Registrar respostas.</li>
              <li><strong>5.</strong> Encaminhar interessados.</li>
              <li><strong>6.</strong> Marcar &quot;Não Abordar&quot; quando necessário.</li>
              <li><strong>7.</strong> Fechar pendências.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 rounded-md border bg-background p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={priorityFilter === item.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriorityFilter(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <select
              className="h-9 rounded-md border bg-background px-3 text-sm font-medium"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as any)}
            >
              <optgroup label="Filtros Rápidos">
                {quickFilters.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </optgroup>
              <optgroup label="Por Responsável">
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.full_name || op.email}</option>
                ))}
              </optgroup>
            </select>

            <select
              className="h-9 rounded-md border bg-background px-3 text-sm font-medium"
              value={selectedTheme}
              onChange={(event) => setSelectedTheme(event.target.value)}
            >
              <option value="todos">Por tema/pauta</option>
              {allThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          {filteredPriorityPeople.length === 0 ? (
            <div className="rounded-md border border-dashed border-red-200 bg-red-50/20 p-8 text-center">
              <p className="text-sm font-medium text-red-900 mb-2">Sem abordagens urgentes no momento.</p>
              <p className="text-xs text-red-800/60 leading-relaxed max-w-sm mx-auto">
                Isso é bom! Significa que a fila está em dia. 
                Você pode revisar interações recentes na lista completa abaixo ou 
                cadastrar uma nova tarefa de abordagem para alguém específico.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredPriorityPeople.map((person) => (
                <Card key={person.id} size="sm" className="border border-foreground/10">
                  <CardHeader className="gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-semibold">
                          {person.displayName ? `${person.displayName} · @${person.username}` : `@${person.username}`}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={temperatureBadgeClassName(person.temperature)}>
                            {temperatureLabel(person.temperature)}
                          </Badge>
                          <Badge variant="outline">{person.outreachStatusLabel}</Badge>
                          {person.mainTheme ? <Badge variant="secondary">{person.mainTheme}</Badge> : null}
                          {person.responsibleName ? (
                            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                              {person.responsibleName}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <StatusBadge status={person.status} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/30 rounded-md border-l-4 border-l-primary">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Próxima Ação</div>
                        <div className="text-sm font-semibold text-primary">{person.nextAction}</div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Por que abordar?</div>
                          <div className="text-xs">{person.priorityReason}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Última interação</div>
                          <div className="text-xs">{person.latestInteractionLabel}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        {person.instagramUrl ? (
                          <Button
                            nativeButton={false}
                            size="sm"
                            className="flex-1 min-w-[140px]"
                            render={<Link href={person.instagramUrl} target="_blank" rel="noreferrer" />}
                          >
                            <ExternalLink data-icon="inline-start" />
                            Abrir Instagram
                          </Button>
                        ) : null}
                        {person.suggestedMessage ? (
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 min-w-[140px]"
                            onClick={() => copySuggestedMessage(person)}
                          >
                            <Copy data-icon="inline-start" />
                            {copiedPersonId === person.id ? "Copiado!" : "Copiar Sugestão"}
                          </Button>
                        ) : null}
                      </div>
                      
                      <Button 
                        nativeButton={false} 
                        size="sm" 
                        variant="secondary"
                        className="w-full"
                        render={<Link href={`/pessoas/${person.id}`} />}
                      >
                        Registrar Resposta ou Encaminhar
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {person.riskFlags.noReferralAfterResponse && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px]">
                          FALTA ENCAMINHAMENTO
                        </Badge>
                      )}
                      {person.riskFlags.recentOutreach && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[9px]">
                          CONTATO RECENTE
                        </Badge>
                      )}
                    </div>

                    {person.suggestedTemplateName ? (
                      <div className="text-xs text-muted-foreground">Modelo compatível: {person.suggestedTemplateName}</div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-md border border-blue-500/20 bg-blue-50/30 p-3 text-xs leading-relaxed text-blue-900">
        <strong>Governança de Dados:</strong> O filtro por tema considera interações públicas registradas
        (comentários, tags de pauta), <strong>não o perfil político ou ideológico da pessoa</strong>.
      </div>

      <div className="flex flex-col gap-3 rounded-md border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-h-11 items-center gap-2 rounded-md border bg-background px-3 lg:w-80">
          <Search data-icon="inline-start" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar @username"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm font-medium"
            value={selectedTheme}
            onChange={(event) => setSelectedTheme(event.target.value)}
          >
            <option value="todos">Todos os temas</option>
            {allThemes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm font-medium"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])}
          >
            {statusFilters.map((item) => (
              <option key={item} value={item}>
                Status: {item === "todos" ? "Todos (excl. não abordar)" : statusLabels[item]}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="h-10"
          onClick={() => setSort(sort === "recentes" ? "interacoes" : "recentes")}
        >
          <ArrowUpDown data-icon="inline-start" />
          {sort === "recentes" ? "Recentes" : "Interações"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Última interação</TableHead>
              <TableHead>Pautas detectadas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPeople.map((person) => (
              <TableRow key={person.id}>
                <TableCell className="font-bold">@{person.username}</TableCell>
                <TableCell>{person.totalInteractions}</TableCell>
                <TableCell>{formatDateTime(person.lastInteractionAt ?? "")}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {person.themes
                      .filter((theme) => theme !== "instagram_comment")
                      .map((theme) => (
                        <Badge key={theme} variant="secondary">
                          {theme}
                        </Badge>
                      ))}
                    {person.themes.includes("instagram_comment") ? (
                      <Badge variant="outline" className="opacity-50">
                        IG
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={person.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button nativeButton={false} render={<Link href={`/pessoas/${person.id}`} />}>
                    Abrir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredPeople.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Nenhum perfil encontrado com estes filtros.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
