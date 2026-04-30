"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acknowledgeIncident, resolveIncident } from "@/app/operacao/incidentes/actions";
import type { OperationalIncidentRow } from "@/lib/types";

export function IncidentActions({ incident, canManage }: { incident: OperationalIncidentRow; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (!canManage) return null;
  if (incident.status === "resolved") return null;

  return (
    <div className="flex gap-2">
      {incident.status === "open" ? (
        <Button
          id={`ack-incident-${incident.id}`}
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await acknowledgeIncident(incident.id);
            });
          }}
        >
          Reconhecer
        </Button>
      ) : null}
      <Button
        id={`resolve-incident-${incident.id}`}
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await resolveIncident(incident.id);
          });
        }}
      >
        Resolver
      </Button>
    </div>
  );
}
