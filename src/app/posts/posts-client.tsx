"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDateTime } from "@/lib/mock-data";
import { ExternalLink, MessageSquare, Search } from "lucide-react";
import type { IgPost } from "@/lib/types";

export function PostsClient({ posts }: { posts: IgPost[] }) {
  const [query, setQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("todos");

  const allThemes = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => set.add(p.topic));
    return Array.from(set);
  }, [posts]);

  const filtered = useMemo(() => {
    return posts
      .filter((post) => selectedTheme === "todos" || post.topic === selectedTheme)
      .filter((post) => (post.caption || "").toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.interactions - a.interactions);
  }, [posts, query, selectedTheme]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-h-11 items-center gap-2 rounded-md border bg-background px-3 lg:w-80">
          <Search data-icon="inline-start" className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por legenda..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </label>
        
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
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Pauta Principal</TableHead>
                <TableHead>Comentários</TableHead>
                <TableHead>Mobilização</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-[300px]">
                    <p className="font-semibold truncate">{post.caption || "(Sem legenda)"}</p>
                    <a 
                      href={post.permalink ?? "#"} 
                      target="_blank" 
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver no Instagram
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{post.topic}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      {post.comments}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-lg">{post.interactions}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDateTime(post.publishedAt || "")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/posts/${post.id}`} />}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground italic">
                    Nenhum post encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
