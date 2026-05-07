import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminClient();

  try {
    const { data: people, error } = await supabase
      .from("ig_people")
      .select(`
        id,
        created_at,
        username,
        display_name,
        status,
        do_not_contact_reason,
        outreach_tasks (
          column_key,
          responsible_id,
          completed_at,
          updated_at,
          internal_users ( full_name )
        ),
        ig_person_referrals (
          target_type,
          status,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!people || people.length === 0) {
      return new NextResponse("Data,Pessoa,Responsavel,StatusPessoa,ProximaAcao(Task),Encaminhamento,Obs\n", {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="piloto-7-dias-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const rows = people.map((p) => {
      const task = p.outreach_tasks?.[0] || null;
      const responsibleName = task?.internal_users ? (task.internal_users as unknown as { full_name: string }).full_name : "Sem responsável";
      const referral = p.ig_person_referrals?.[0] || null;

      const dateStr = p.created_at ? p.created_at.split("T")[0] : "";
      const nameStr = p.display_name ? `${p.username} (${p.display_name})` : p.username;
      
      const lastActionAt = task?.updated_at || p.created_at;
      
      const fields = [
        dateStr,
        nameStr,
        responsibleName,
        p.status,
        task ? task.column_key : "Sem tarefa",
        referral ? `${referral.target_type} (${referral.status})` : "Sem encaminhamento",
        lastActionAt ? String(lastActionAt).split("T")[0] : "",
        p.do_not_contact_reason || "",
      ];

      // Escape quotes and wrap in quotes for CSV
      return fields
        .map((f) => {
          const str = String(f || "");
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    const header = "Data,Pessoa,Responsavel,StatusPessoa,ProximaAcao(Task),Encaminhamento,UltimaAcao,Obs\n";
    const csvContent = header + rows.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="piloto-7-dias-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
