import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { buildVolunteerReviewDashboardExport, getVolunteerReviewDashboard } from "@/lib/data/volunteer-review-dashboard";
import { requireInternalSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireInternalSession();
  const dashboard = await getVolunteerReviewDashboard();
  const row = buildVolunteerReviewDashboardExport(dashboard);

  await writeAuditLog({
    actorId: session.id,
    actorEmail: session.email,
    action: "volunteer_application.exported",
    entityType: "volunteer_review_dashboard",
    entityId: null,
    summary: "Exportação agregada da revisão periódica de voluntariado.",
    metadata: { aggregateOnly: true },
  });

  return NextResponse.json(row);
}
