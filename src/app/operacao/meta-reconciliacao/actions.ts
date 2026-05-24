"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRole } from "@/lib/authz/roles";
import { generateMetaReconciliationEvidence } from "@/lib/data/meta-reconciliation-evidence";
import { requireInternalSession } from "@/lib/supabase/auth";

export async function generateMetaReconciliationEvidenceAction(): Promise<void> {
  try {
    const session = await requireInternalSession();
    await requireRole(["admin", "operador"]);

    const evidence = await generateMetaReconciliationEvidence();

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "meta.reconciliation_evidence_generated",
      entityType: "meta_reconciliation_evidence",
      entityId: evidence.id,
      summary: "Evidência operacional Meta gerada com contagens agregadas.",
      metadata: {
        status: evidence.status,
        report_hash: evidence.report_hash,
        generated_at: evidence.generated_at,
      },
    });

    revalidatePath("/operacao/meta-reconciliacao");
    revalidatePath("/api/health");
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Falha ao gerar evidência operacional.");
  }
}
