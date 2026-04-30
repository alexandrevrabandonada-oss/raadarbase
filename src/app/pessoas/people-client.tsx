"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
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
import type { IgPerson, PersonStatus } from "@/lib/types";

const filters: ("todos" | PersonStatus)[] = [
  "todos",
  "novo",
  "responder",
  "abordado",
  "respondeu",
  "contato_confirmado",
  "nao_abordar",
];

export function PeopleClient({ people }: { people: IgPerson[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("todos");
  const [origin] = useState<"todas" | "manual" | "instagram_comment" | "importado">("todas");
  const [sort, setSort] = useState<"recentes" | "interacoes">("recentes");
  const [selectedTheme, setSelectedTheme] = useState("todos");

  const allThemes = useMemo(() => {
    const set = new Set<string>();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    people.forEach((p: any) => p.themes.forEach((t: any) => set.add(t)));
    return Array.from(set).filter(t => t !== 'instagram_comment');
  }, [people]);

  const filtered = useMemo(() => {
    return people
      .filter((person) => {
        if (filter === "todos") return person.status !== "nao_abordar";
        return person.status === filter;
      })
      .filter((person) => {
        if (selectedTheme === "todos") return true;
        return person.themes.includes(selectedTheme);
      })
      .filter((person) => {
        if (origin === "todas") return true;
        if (origin === "instagram_comment") return person.themes.includes("instagram_comment");
        if (origin === "manual") return !person.syncedAt && !person.themes.includes("instagram_comment");
        return Boolean(person.syncedAt);
      })
      .filter((person) => person.username.toLowerCase().includes(query.replace("@", "").toLowerCase()))
      .sort((a, b) =>
        sort === "recentes"
          ? Date.parse(b.lastInteractionAt ?? "1970-01-01") - Date.parse(a.lastInteractionAt ?? "1970-01-01")
          : b.totalInteractions - a.totalInteractions,
      );
  }, [filter, origin, people, query, sort, selectedTheme]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-blue-500/20 bg-blue-50/30 p-3 text-xs text-blue-900 leading-relaxed">
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
            onChange={(e) => setSelectedTheme(e.target.value)}
          >
            <option value="todos">Todos os temas</option>
            {allThemes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm font-medium"
            value={filter}
            onChange={(event) => setFilter(event.target.value as (typeof filters)[number])}
          >
            {filters.map((item) => (
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
            {filtered.map((person) => (
              <TableRow key={person.id}>
                <TableCell className="font-bold">@{person.username}</TableCell>
                <TableCell>{person.totalInteractions}</TableCell>
                <TableCell>{formatDateTime(person.lastInteractionAt ?? "")}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {person.themes.filter(t => t !== 'instagram_comment').map((theme) => (
                      <Badge key={theme} variant="secondary">{theme}</Badge>
                    ))}
                    {person.themes.includes("instagram_comment") ? (
                      <Badge variant="outline" className="opacity-50">IG</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell><StatusBadge status={person.status} /></TableCell>
                <TableCell className="text-right">
                  <Button nativeButton={false} render={<Link href={`/pessoas/${person.id}`} />}>
                    Abrir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Nenhum perfil encontrado com estes filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
