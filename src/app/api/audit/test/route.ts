import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireInternalSession } from "@/lib/supabase/auth";

export async function POST() {
  try {
    const user = await requireInternalSession();
    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email ?? null,
      action: "audit.tested",
      entityType: "system",
      entityId: null,
      summary: "Teste manual de escrita de audit_log.",
      metadata: { origin: "settings_page" },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao gravar audit_log." },
      { status: 500 },
    );
  }
}
