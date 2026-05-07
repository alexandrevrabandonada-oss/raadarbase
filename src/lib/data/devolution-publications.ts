import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PublicDevolutionPublicationRow } from "@/lib/types";

export async function getDevolutionPublicationByReportId(reportId: string): Promise<PublicDevolutionPublicationRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("public_devolution_publications")
    .select("*")
    .eq("report_id", reportId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar publicação da devolutiva: ${error.message}`);
  }

  return data as PublicDevolutionPublicationRow | null;
}
