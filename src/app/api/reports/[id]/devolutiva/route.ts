import { NextRequest, NextResponse } from "next/server";
import { requireInternalSession } from "@/lib/supabase/auth";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getPublicDevolutiveKit, renderPublicDevolutiveHtml, renderPublicDevolutiveMarkdown } from "@/lib/data/report-devolutive";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireInternalSession();
    const { id } = await params;
    const kit = await getPublicDevolutiveKit(id);
    const format = req.nextUrl.searchParams.get("format") === "html" ? "html" : "markdown";

    await writeAuditLog({
      actorId: session.id,
      actorEmail: session.email,
      action: "report.exported",
      entityType: "mobilization_reports",
      entityId: id,
      summary: `Kit de devolutiva exportado em ${format}.`,
      metadata: { format, kit: true },
    });

    if (format === "html") {
      return new NextResponse(renderPublicDevolutiveHtml(kit), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new NextResponse(renderPublicDevolutiveMarkdown(kit), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="devolutiva-${id}.md"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na exportação." }, { status: 500 });
  }
}