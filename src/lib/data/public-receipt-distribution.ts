/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { shouldUseMockData } from "@/lib/config";

export type PublicReceiptDistributionLog = {
  id: string;
  channel: "instagram_feed" | "instagram_story" | "whatsapp" | "telegram" | "reuniao" | "outro";
  status: "planned" | "shared" | "archived";
  format: "1x1" | "3x4" | "texto" | "link";
  public_url: string | null;
  shared_at: string | null;
  notes: string | null;
  cycle_id: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type PublicReceiptDistributionCycle = {
  id: string;
  title: string;
  status: "planned" | "active" | "closed" | "archived";
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

export async function listReceiptDistributionLogs(): Promise<PublicReceiptDistributionLog[]> {
  if (shouldUseMockData()) {
    return [
      {
        id: "mock-log-1",
        channel: "whatsapp",
        status: "planned",
        format: "texto",
        public_url: null,
        shared_at: null,
        notes: "Grupo do bairro Centro",
        cycle_id: null,
        created_by: null,
        created_by_email: "mock@example.com",
        created_at: new Date().toISOString(),
        metadata: {},
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase
    .from("public_receipt_distribution_logs" as any) as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao listar logs de distribuição: ${error.message}`);
  }

  return data as PublicReceiptDistributionLog[];
}

export async function createReceiptDistributionLogAction(input: {
  channel: PublicReceiptDistributionLog["channel"];
  format: PublicReceiptDistributionLog["format"];
  notes?: string;
  cycleId?: string;
}) {
  const session = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  if (shouldUseMockData()) {
    revalidatePath("/recibo/escuta");
    revalidatePath("/recibo/escuta/distribuicao");
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase
    .from("public_receipt_distribution_logs" as any) as any)
    .insert({
      channel: input.channel,
      format: input.format,
      notes: input.notes || null,
      cycle_id: input.cycleId || null,
      created_by: session.id,
      created_by_email: session.email,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao criar log de distribuição: ${error.message}`);
  }

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: "receipt_distribution.created",
    entityType: "public_receipt_distribution_logs",
    entityId: data.id,
    summary: `Criado planejamento de distribuição para ${input.channel} (${input.format}).`,
    metadata: { cycle_id: input.cycleId },
  });

  revalidatePath("/recibo/escuta");
  revalidatePath("/recibo/escuta/distribuicao");
}

export async function markReceiptDistributionSharedAction(id: string, input?: { publicUrl?: string }) {
  const session = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  if (shouldUseMockData()) {
    revalidatePath("/recibo/escuta");
    return;
  }

  const supabase = getSupabaseAdminClient();
  const sharedAt = new Date().toISOString();
  
  const { error } = await (supabase
    .from("public_receipt_distribution_logs" as any) as any)
    .update({
      status: "shared",
      shared_at: sharedAt,
      public_url: input?.publicUrl || null,
    })
    .eq("id", id)
    .eq("status", "planned");

  if (error) {
    throw new Error(`Falha ao marcar log de distribuição como compartilhado: ${error.message}`);
  }

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: "receipt_distribution.shared",
    entityType: "public_receipt_distribution_logs",
    entityId: id,
    summary: `Marcação de compartilhamento de recibo concluída.`,
    metadata: { shared_at: sharedAt, public_url: input?.publicUrl },
  });

  revalidatePath("/recibo/escuta");
}

export async function archiveReceiptDistributionAction(id: string) {
  const session = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  if (shouldUseMockData()) {
    revalidatePath("/recibo/escuta");
    return;
  }

  const supabase = getSupabaseAdminClient();
  
  const { error } = await (supabase
    .from("public_receipt_distribution_logs" as any) as any)
    .update({
      status: "archived",
    })
    .eq("id", id)
    .neq("status", "archived");

  if (error) {
    throw new Error(`Falha ao arquivar log de distribuição: ${error.message}`);
  }

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: "receipt_distribution.archived",
    entityType: "public_receipt_distribution_logs",
    entityId: id,
    summary: `Log de distribuição de recibo arquivado.`,
    metadata: {},
  });

  revalidatePath("/recibo/escuta");
  revalidatePath("/recibo/escuta/distribuicao");
}

export async function listReceiptDistributionCycles(): Promise<PublicReceiptDistributionCycle[]> {
  if (shouldUseMockData()) {
    return [
      {
        id: "mock-cycle-1",
        title: "Primeira Onda de Divulgação",
        status: "active",
        starts_at: new Date().toISOString(),
        ends_at: null,
        created_by: null,
        created_by_email: "mock@example.com",
        created_at: new Date().toISOString(),
        metadata: {},
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase
    .from("public_receipt_distribution_cycles" as any) as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao listar ciclos de distribuição: ${error.message}`);
  }

  return data as PublicReceiptDistributionCycle[];
}

export async function createReceiptDistributionCycleAction(input: { title: string; notes?: string }) {
  const session = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  if (shouldUseMockData()) {
    revalidatePath("/recibo/escuta/distribuicao");
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase
    .from("public_receipt_distribution_cycles" as any) as any)
    .insert({
      title: input.title,
      created_by: session.id,
      created_by_email: session.email,
      metadata: { notes: input.notes },
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao criar ciclo de distribuição: ${error.message}`);
  }

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: "receipt_distribution_cycle.created",
    entityType: "public_receipt_distribution_cycles",
    entityId: data.id,
    summary: `Criado ciclo de distribuição: ${input.title}`,
    metadata: { notes: input.notes },
  });

  revalidatePath("/recibo/escuta/distribuicao");
}

export async function startReceiptDistributionCycleAction(id: string) {
  const session = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  if (shouldUseMockData()) {
    revalidatePath("/recibo/escuta/distribuicao");
    return;
  }

  const supabase = getSupabaseAdminClient();
  const startsAt = new Date().toISOString();
  
  const { error } = await (supabase
    .from("public_receipt_distribution_cycles" as any) as any)
    .update({
      status: "active",
      starts_at: startsAt,
    })
    .eq("id", id)
    .eq("status", "planned");

  if (error) {
    throw new Error(`Falha ao iniciar ciclo de distribuição: ${error.message}`);
  }

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: "receipt_distribution_cycle.started",
    entityType: "public_receipt_distribution_cycles",
    entityId: id,
    summary: `Iniciado ciclo de distribuição.`,
    metadata: { starts_at: startsAt },
  });

  revalidatePath("/recibo/escuta/distribuicao");
}

export async function closeReceiptDistributionCycleAction(id: string) {
  const session = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  if (shouldUseMockData()) {
    revalidatePath("/recibo/escuta/distribuicao");
    return;
  }

  const supabase = getSupabaseAdminClient();
  const endsAt = new Date().toISOString();
  
  const { error } = await (supabase
    .from("public_receipt_distribution_cycles" as any) as any)
    .update({
      status: "closed",
      ends_at: endsAt,
    })
    .eq("id", id)
    .eq("status", "active");

  if (error) {
    throw new Error(`Falha ao fechar ciclo de distribuição: ${error.message}`);
  }

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: "receipt_distribution_cycle.closed",
    entityType: "public_receipt_distribution_cycles",
    entityId: id,
    summary: `Fechado ciclo de distribuição.`,
    metadata: { ends_at: endsAt },
  });

  revalidatePath("/recibo/escuta/distribuicao");
}

export async function linkDistributionLogToCycleAction(logId: string, cycleId: string) {
  const session = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  if (shouldUseMockData()) {
    revalidatePath("/recibo/escuta/distribuicao");
    return;
  }

  const supabase = getSupabaseAdminClient();
  
  const { error } = await (supabase
    .from("public_receipt_distribution_logs" as any) as any)
    .update({ cycle_id: cycleId })
    .eq("id", logId);

  if (error) {
    throw new Error(`Falha ao vincular log ao ciclo: ${error.message}`);
  }

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: "receipt_distribution_cycle.log_linked",
    entityType: "public_receipt_distribution_logs",
    entityId: logId,
    summary: `Log de distribuição vinculado ao ciclo.`,
    metadata: { cycle_id: cycleId },
  });

  revalidatePath("/recibo/escuta/distribuicao");
}
