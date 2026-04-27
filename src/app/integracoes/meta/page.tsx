import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getMetaConfigStatus } from "@/lib/meta/client";
import { getLatestMetaSyncRuns } from "@/lib/meta/sync";
import type { TableRow } from "@/lib/supabase/database.types";
import { MetaSyncClient } from "./meta-sync-client";

export const dynamic = "force-dynamic";

export default async function MetaIntegrationPage() {
  let runs: TableRow<"meta_sync_runs">[] = [];
  try {
    runs = await getLatestMetaSyncRuns();
  } catch {
    runs = [];
  }

  return (
    <AppShell>
      <PageHeader
        title="Integração Meta"
        description="Sincronização manual, somente leitura e auditável da conta Instagram conectada."
      />
      <MetaSyncClient status={getMetaConfigStatus()} runs={runs} />
    </AppShell>
  );
}
