"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { 
  createMobilizationReportDraft, 
  generateMobilizationReportSnapshotData,
  archiveMobilizationReport 
} from "@/lib/data/reports";
import { validateReportTextSafety } from "@/lib/reports/safety";
import type { ActionResult } from "@/app/actions";

export async function createMobilizationReportAction(input: {
  title: string;
  description?: string;
  period_start?: string;
  period_end?: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  filters?: any;
}): Promise<ActionResult & { reportId?: string }> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    // Validação de termos proibidos
    const titleSafety = validateReportTextSafety(input.title);
    if (!titleSafety.ok) {
      await writeAuditLog({
        actorId: session.id,
        actorEmail: session.email,
        action: "report.forbidden_term_detected",
        entityType: "mobilization_reports",
        entityId: null,
        summary: `Termo proibido detectado no título do relatório: ${titleSafety.forbiddenTerm}`,
        metadata: { title: input.title },
      });
      throw new Error(`O termo "${titleSafety.forbiddenTerm}" é proibido em relatórios.`);
    }

    const descSafety = validateReportTextSafety(input.description || null);
    if (!descSafety.ok) {
      throw new Error(`O termo "${descSafety.forbiddenTerm}" é proibido na descrição.`);
    }

    const report = await createMobilizationReportDraft({
      ...input,
      created_by: session.id,
      created_by_email: session.email || "",
      filters: input.filters || {},
    });

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "report.created",
      entityType: "mobilization_reports",
      entityId: report.id,
      summary: `Rascunho de relatório criado: ${report.title}`,
    });

    revalidatePath("/relatorios");
    return { ok: true, message: "Rascunho criado com sucesso.", reportId: report.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao criar relatório.",
    };
  }
}

export async function generateMobilizationReportAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    await generateMobilizationReportSnapshotData(id);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "report.generated",
      entityType: "mobilization_reports",
      entityId: id,
      summary: "Relatório de mobilização gerado com snapshot de dados.",
    });

    revalidatePath(`/relatorios/${id}`);
    revalidatePath("/relatorios");
    return { ok: true, message: "Relatório gerado com sucesso." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao gerar relatório.",
    };
  }
}

export async function archiveMobilizationReportAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin"]);

    await archiveMobilizationReport(id);

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "report.archived",
      entityType: "mobilization_reports",
      entityId: id,
      summary: "Relatório arquivado.",
    });

    revalidatePath("/relatorios");
    return { ok: true, message: "Relatório arquivado." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao arquivar relatório.",
    };
  }
}
