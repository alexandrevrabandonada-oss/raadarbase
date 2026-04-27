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
  const [origin, setOrigin] = useState<"todas" | "manual" | "instagram_comment" | "importado">("todas");
  const [sort, setSort] = useState<"recentes" | "interacoes">("recentes");

  const filtered = useMemo(() => {
    return people
      .filter((person) => filter === "todos" || person.status === filter)
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
  }, [filter, origin, people, query, sort]);

  return (
    <div className="flex flex-col gap-4">
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
          {filters.map((item) => (
            <Button
              key={item}
              type="button"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item === "todos" ? "Todos" : statusLabels[item]}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setSort(sort === "recentes" ? "interacoes" : "recentes")}
        >
          <ArrowUpDown data-icon="inline-start" />
          {sort === "recentes" ? "Mais recentes" : "Mais interações"}
        </Button>
        <select
          className="min-h-11 rounded-md border bg-background px-3 text-sm font-medium"
          value={origin}
          onChange={(event) => setOrigin(event.target.value as typeof origin)}
          aria-label="Origem"
        >
          <option value="todas">Origem: todas</option>
          <option value="manual">Manual</option>
          <option value="instagram_comment">Instagram comment</option>
          <option value="importado">Importado</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Última interação</TableHead>
              <TableHead>Temas</TableHead>
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
                    {person.themes.map((theme) => (
                      <Badge key={theme} variant="secondary">{theme}</Badge>
                    ))}
                    {person.themes.includes("instagram_comment") ? (
                      <Badge variant="outline">Comentou no Instagram</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell><StatusBadge status={person.status} /></TableCell>
                <TableCell className="text-right">
                  <Button render={<Link href={`/pessoas/${person.id}`} />}>
                    Abrir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
