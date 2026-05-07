"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { 
  Search, 
  Flame, 
  UserPlus, 
  Info,
  CheckCircle2,
  Users,
  Filter
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/mock-data";
import type { IgPerson, PeoplePriorityQuickFilter, PersonStatus, PriorityPerson } from "@/lib/types";
import { assumePersonResponsible } from "@/app/actions";
import { cn } from "@/lib/utils";

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
  { id: "todos", label: "Geral" },
  { id: "quentes", label: "Urgentes" },
  { id: "sem_responsavel", label: "Sem Dono" },
  { id: "pendente_resposta", label: "Esperando" },
  { id: "sem_encaminhamento", label: "A encaminhar" },
];

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
  const [priorityFilter, setPriorityFilter] = useState<PeoplePriorityQuickFilter | "quer_evento" | "quer_voluntariado" | "quer_eluta">("todos");
  const [isPending, startTransition] = useTransition();

  const filteredPriorityPeople = useMemo(() => {
    return priorityPeople
      .filter((person) => {
        if (!person.priorityEligible) return false;
        
        switch (priorityFilter) {
          case "quentes":
            return person.temperature === "quente";
          case "sem_responsavel":
            return !person.responsibleName;
          case "pendente_resposta":
            return person.isPendingResponse;
          case "sem_encaminhamento":
            return person.status === "respondeu" && !person.hasReferral;
          case "quer_evento":
            return person.themes.includes("quer_evento_campo");
          case "quer_voluntariado":
            return person.themes.includes("quer_voluntariado");
          case "quer_eluta":
            return person.themes.includes("quer_missao_eluta");
          default:
            if (operators.some(op => op.id === priorityFilter)) {
              return person.responsibleId === priorityFilter;
            }
            return true;
        }
      })
      .slice(0, 10);
  }, [operators, priorityFilter, priorityPeople]);

  const filteredPeople = useMemo(() => {
    return people
      .filter((person) => {
        if (statusFilter === "todos") return person.status !== "nao_abordar";
        return person.status === statusFilter;
      })
      .filter((person) => person.username.toLowerCase().includes(query.replace("@", "").toLowerCase()))
      .sort((a, b) =>
          Date.parse(b.lastInteractionAt ?? "1970-01-01") - Date.parse(a.lastInteractionAt ?? "1970-01-01")
      );
  }, [people, query, statusFilter]);

  function handleAssume(personId: string) {
    startTransition(async () => {
      await assumePersonResponsible(personId);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Top 10 Hero Section */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-600 fill-orange-600" />
              Top 10 de Hoje
            </h2>
            <p className="text-muted-foreground text-sm">
              As pessoas com mais sinais de vínculo, engajamento recente e chance de virar ação concreta.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex p-1 bg-muted/50 rounded-lg border">
              {quickFilters.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPriorityFilter(item.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                    priorityFilter === item.id 
                      ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredPriorityPeople.length === 0 ? (
          <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">Tudo limpo por aqui!</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Nenhuma pessoa prioritária com estes filtros no momento. Bom trabalho!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {filteredPriorityPeople.map((person, index) => (
              <Card 
                key={person.id} 
                className={cn(
                  "relative group border-2 transition-all hover:shadow-xl hover:-translate-y-1",
                  person.temperature === "quente" ? "border-orange-200" : "border-zinc-100"
                )}
              >
                {/* Ranking Badge */}
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-lg z-10">
                  #{index + 1}
                </div>

                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <CardTitle className="text-base font-black truncate max-w-[140px]">
                        @{person.username}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold tracking-wider">
                        {person.mainTheme || "Engajamento Geral"}
                      </CardDescription>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-end gap-1 cursor-help">
                            <span className="text-[10px] font-black text-orange-600">{person.scoreLabel}</span>
                            <div className="h-1.5 w-12 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                              <div 
                                className="h-full bg-orange-500 transition-all duration-1000" 
                                style={{ width: `${person.scoreIntensity}%` }}
                              />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-xs">
                          {person.scoreTooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium leading-tight text-zinc-600 line-clamp-2 min-h-[2.5rem]">
                      {person.priorityReason}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold">
                      <span>Próxima Ação</span>
                    </div>
                    <p className="text-xs font-black text-indigo-700">
                      {person.nextAction.split(":")[0]}
                    </p>
                    
                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" className="flex-1 font-bold h-9">
                        <Link href={`/pessoas/${person.id}`}>
                          Abrir Ficha
                        </Link>
                      </Button>
                      
                      {person.responsibleId ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                                <Users className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              Responsável: {person.responsibleName}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 shrink-0"
                          onClick={() => handleAssume(person.id)}
                          disabled={isPending}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <hr className="border-zinc-100" />

      {/* Main List Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">Base Operacional</h2>
            <p className="text-muted-foreground text-sm">Acompanhe todos os contatos e sua evolução no funil.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por @username..."
                className="pl-9 h-10 w-full md:w-64"
              />
            </div>
            
            <Button asChild variant="outline" className="h-10 border-indigo-200 text-indigo-700 bg-indigo-50/30 hover:bg-indigo-50">
              <Link href="/pessoas/importar">
                <UserPlus className="h-4 w-4 mr-2" />
                Importar
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-2">
          {statusFilters.map((item) => (
            <Button
              key={item}
              variant={statusFilter === item ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "rounded-full text-xs font-bold",
                statusFilter === item ? "bg-zinc-200" : ""
              )}
              onClick={() => setStatusFilter(item)}
            >
              {item === "todos" ? "Todos ativos" : item.replace("_", " ").toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black text-xs uppercase tracking-wider text-zinc-500 h-12">Username</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-zinc-500 h-12">Interações</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-zinc-500 h-12">Pautas</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-zinc-500 h-12">Status</TableHead>
                <TableHead className="font-black text-xs uppercase tracking-wider text-zinc-500 h-12 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.map((person) => (
                <TableRow key={person.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-zinc-900">@{person.username}</span>
                      <span className="text-[10px] text-muted-foreground">{person.displayName || "Sem nome exibido"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{person.totalInteractions}</span>
                      <span className="text-[10px] text-muted-foreground">Última: {formatDateTime(person.lastInteractionAt ?? "")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {person.themes.length > 0 ? (
                        person.themes.slice(0, 2).map((theme) => (
                          <Badge key={theme} variant="outline" className="text-[9px] uppercase font-black bg-zinc-50">
                            {theme}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Geral</span>
                      )}
                      {person.themes.length > 2 && <span className="text-[10px] text-muted-foreground">+{person.themes.length - 2}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={person.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost" className="hover:bg-indigo-50 hover:text-indigo-700 font-bold h-8">
                      <Link href={`/pessoas/${person.id}`}>
                        Gerenciar
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPeople.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Search className="h-8 w-8" />
                      <p className="font-bold">Ninguém encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Governance Banner */}
      <footer className="mt-12 p-6 rounded-2xl bg-indigo-900 text-indigo-50 flex flex-col md:flex-row items-center gap-6">
        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Info className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-lg">Diretrizes de Engajamento Ético</h4>
          <p className="text-indigo-200/80 text-sm leading-relaxed">
            O Radar de Base utiliza sinais de interação pública (comentários, stories) para sugerir a melhor conversa. 
            É <strong>proibido</strong> o uso destes dados para profiling ideológico ou pressão eleitoral. 
            Toda conversa deve ser manual, humana e respeitar o pedido de privacidade (&quot;Não Abordar&quot;).
          </p>
        </div>
      </footer>
    </div>
  );
}
