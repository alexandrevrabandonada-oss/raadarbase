"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kanbanLabels } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/mock-data";
import type { KanbanColumnId, OutreachTask } from "@/lib/types";

const columns = Object.keys(kanbanLabels) as KanbanColumnId[];

export function KanbanClient({ initialTasks }: { initialTasks: OutreachTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  function moveTask(taskId: string, direction: -1 | 1) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const index = columns.indexOf(task.column);
        return { ...task, column: columns[Math.max(0, Math.min(columns.length - 1, index + direction))] };
      }),
    );
  }

  return (
    <div className="overflow-x-auto pb-3">
      <div className="grid min-w-[1120px] grid-cols-7 gap-4">
        {columns.map((column) => (
        <Card key={column} className="min-h-64">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{kanbanLabels[column]}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {tasks
              .filter((task) => task.column === column)
              .map((task) => {
                const person = task.person;
                return (
                  <div key={task.id} className="rounded-md border bg-background p-3">
                    <p className="font-bold">@{person?.username}</p>
                    <p className="mt-1 text-sm">{task.title}</p>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      {task.dueAt ? formatDateTime(task.dueAt) : "Sem prazo"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => moveTask(task.id, -1)}>
                        Voltar
                      </Button>
                      <Button type="button" size="sm" onClick={() => moveTask(task.id, 1)}>
                        Avançar
                      </Button>
                    </div>
                    {person ? (
                      <Button
                        render={<Link href={`/pessoas/${person.id}`} />}
                        variant="link"
                        className="mt-2 h-auto p-0"
                      >
                        Ver pessoa
                      </Button>
                    ) : null}
                  </div>
                );
              })}
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  );
}
