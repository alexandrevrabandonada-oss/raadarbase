import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireInternalSession } from "@/lib/supabase/auth";
import type { TableRow } from "@/lib/supabase/database.types";

export async function GET() {
  try {
    const user = await requireInternalSession();
    const supabase = getSupabaseAdminClient();
    const { data: contacts, error: contactsError } = await supabase.from("contacts").select("*").eq("consent_status", "confirmed");
    if (contactsError) throw contactsError;

    const eligibleContacts = (contacts ?? []) as TableRow<"contacts">[];
    const personIds = eligibleContacts.map((contact) => contact.person_id);
    const peopleFilter = personIds.length
      ? `id.in.(${personIds.join(",")}),status.eq.contato_confirmado`
      : "status.eq.contato_confirmado";
    const { data: people, error: peopleError } = await supabase
      .from("ig_people")
      .select("*")
      .or(peopleFilter)
      .neq("status", "nao_abordar");
    if (peopleError) throw peopleError;

    const peopleById = new Map((people ?? []).map((person) => [person.id, person]));
    const contactsByPersonId = new Map(eligibleContacts.map((contact) => [contact.person_id, contact]));
    const rows = Array.from(peopleById.values())
      .map((person) => ({ contact: contactsByPersonId.get(person.id) ?? null, person }))
      .filter(
        ({ contact, person }) =>
          Boolean(person) &&
          ((contact?.consent_status === "confirmed") || person?.status === "contato_confirmado") &&
          person?.status !== "nao_abordar",
      );

    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email ?? null,
      action: "contacts.exported",
      entityType: "contacts",
      entityId: null,
      summary: `Exportacao CSV gerada com ${rows.length} contatos.`,
      metadata: { count: rows.length },
    });

    const csvRows = [
      ["username", "display_name", "phone", "email", "source", "consent_status", "status", "last_contacted_at", "notes"],
      ...rows.map(({ contact, person }) => [
        person?.username ?? "",
        person?.display_name ?? "",
        contact?.phone ?? "",
        contact?.email ?? "",
        contact?.source ?? "instagram_manual",
        contact?.consent_status ?? "confirmed",
        person?.status ?? "",
        contact?.last_contacted_at ?? "",
        person?.notes ?? "",
      ]),
    ];

    const csv = csvRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="contatos-confirmados.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao exportar CSV." },
      { status: 500 },
    );
  }
}
