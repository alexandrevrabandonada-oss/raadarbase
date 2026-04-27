import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { getInternalSession } from "@/lib/supabase/auth";
import {
  E2E_BYPASS_AUTH_ACTIVE,
  E2E_BYPASS_AUTH_MISCONFIGURED,
  getEnvironmentLabel,
  getMockModeLabel,
  isSupabaseConfigured,
} from "@/lib/config";
import { getLatestAuditByAction } from "@/lib/data/audit";
import { getLatestMetaSyncError, getLatestMetaSyncRun } from "@/lib/data/operation";
import { listConfirmedPeople } from "@/lib/data/people";
import { isMetaConfigured } from "@/lib/meta/client";
import { getStuckSyncRuns } from "@/lib/operation/stuck-runs";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const user = await getInternalSession();
  let latestAuditTest = null;
  let latestMetaError = null;
  let latestMetaRun = null;
  let stuckRuns = [];
  let confirmedPeople = [];
  try {
    [latestAuditTest, confirmedPeople, latestMetaError, latestMetaRun, stuckRuns] = await Promise.all([
      getLatestAuditByAction("audit.tested"),
      listConfirmedPeople(),
      getLatestMetaSyncError().catch(() => null),
      getLatestMetaSyncRun().catch(() => null),
      getStuckSyncRuns().catch(() => []),
    ]);
  } catch (error) {
    return (
      <AppShell>
        <PageHeader title="Configurações e conformidade" description="Controles de seguranca e operacao." />
        <RuntimeAlert
          title="Falha ao carregar configuracoes"
          description={error instanceof Error ? error.message : "Nao foi possivel carregar configuracoes."}
        />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <PageHeader
        title="Configurações e conformidade"
        description="Registre finalidade, consentimento e rotinas de privacidade antes de usar a base em operação real."
      />
      <SettingsClient
        userEmail={user?.email ?? null}
        environment={getEnvironmentLabel()}
        mockMode={getMockModeLabel()}
        supabaseConnected={isSupabaseConfigured()}
        latestAuditTest={latestAuditTest?.createdAt ?? null}
        latestMetaError={latestMetaError?.error_message ?? null}
        stuckSyncRunsCount={stuckRuns.length}
        latestMetaStatus={latestMetaRun?.status ?? null}
        e2eBypassActive={E2E_BYPASS_AUTH_ACTIVE}
        e2eBypassMisconfigured={E2E_BYPASS_AUTH_MISCONFIGURED}
        metaConfigured={isMetaConfigured()}
        confirmedPeople={confirmedPeople}
      />
    </AppShell>
  );
}
