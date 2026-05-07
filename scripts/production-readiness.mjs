import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const sensitiveMarkers = [
  /meta_app_secret/i,
  /meta_access_token/i,
  /meta_webhook_verify_token/i,
  /supabase_service_role_key/i,
  /next_public_supabase_anon_key/i,
  /access_token/i,
  /app_secret/i,
  /service_role/i,
  /webhook_verify_token/i,
  /bearer\s+[a-z0-9._-]+/i,
  /raw_payload/i,
  /["']contact_email["']\s*:/i,
  /["']contact_phone["']\s*:/i,
  /["']comment_text["']\s*:/i,
  /["']username["']\s*:/i,
];

const secretEnvKeys = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "META_ACCESS_TOKEN",
  "META_APP_SECRET",
  "META_WEBHOOK_VERIFY_TOKEN",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

if (existsSync(".env.local")) {
  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=");
  }
}

const requiredScripts = ["lint", "build", "test", "check:health", "e2e:ci", "ci", "readiness", "verify", "staging:webhook:dry-run", "production:webhook:preflight", "production:go-no-go", "production:decision-pack"];
requiredScripts.push("production:decision:validate");
requiredScripts.push("production:shadow-check", "production:shadow-report");
requiredScripts.push("production:route-audit", "production:rls-audit", "production:role-audit", "production:access-audit-report");
requiredScripts.push("production:final-decision:validate", "production:final-decision-pack");
const requiredMigrations = [
  "001_initial_schema.sql",
  "002_operational_hardening.sql",
  "003_meta_ingestion.sql",
  "004_internal_user_access.sql",
  "005_backfill_internal_users.sql",
  "006_bootstrap_first_admin.sql",
  "007_retention_policy.sql",
  "008_internal_roles.sql",
  "009_operational_incidents.sql",
  "010_topic_taxonomy.sql",
  "011_mobilization_reports.sql",
  "012_action_plans.sql",
  "013_action_execution.sql",
  "014_strategic_memory.sql",
  "015_meta_webhooks.sql",
  "015a_add_mention_type.sql",
];

const issues = [];
const warnings = [];

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) {
    issues.push(`Script ausente: ${script}`);
  }
}

for (const migration of requiredMigrations) {
  if (!existsSync(join("supabase", "migrations", migration))) {
    issues.push(`Migration ausente: ${migration}`);
  }
}

const readme = readFileSync("README.md", "utf8");
for (const section of ["npm run ci", "readiness", "Checklist antes de produção", "Checklist antes de avançar para webhooks", "Governança e Papéis Internos", "Painel de Incidentes"]) {
  if (!readme.includes(section)) {
    issues.push(`README sem seção esperada: ${section}`);
  }
}

if (!existsSync(join("docs", "meta-webhooks-readiness.md"))) {
  issues.push("Documento de readiness de webhooks ausente: docs/meta-webhooks-readiness.md");
}

if (!existsSync(join("docs", "meta-webhooks-operator-guide.md"))) {
  issues.push("Guia de operação de webhooks ausente: docs/meta-webhooks-operator-guide.md");
}

if (!existsSync(join("docs", "meta-webhooks-staging-checklist.md"))) {
  issues.push("Checklist de staging de webhooks ausente: docs/meta-webhooks-staging-checklist.md");
}

if (!existsSync(join("docs", "production-webhook-runbook.md"))) {
  issues.push("Runbook de pre-homologacao ausente: docs/production-webhook-runbook.md");
}

if (!existsSync(join("docs", "production-webhook-risk-matrix.md"))) {
  issues.push("Matriz de risco de pre-homologacao ausente: docs/production-webhook-risk-matrix.md");
}

if (!existsSync(join("docs", "webhook-operator-training-checklist.md"))) {
  issues.push("Checklist de treinamento operacional ausente: docs/webhook-operator-training-checklist.md");
}

if (!existsSync(join("docs", "production-go-no-go-meeting-template.md"))) {
  issues.push("Template de ata de decisao ausente: docs/production-go-no-go-meeting-template.md");
}

if (!existsSync(join("docs", "production-shadow-checklist.md"))) {
  issues.push("Checklist de producao shadow ausente: docs/production-shadow-checklist.md");
}

if (!existsSync(join("docs", "production-access-control-audit.md"))) {
  issues.push("Documento de auditoria de acesso ausente: docs/production-access-control-audit.md");
}

if (!existsSync(join("docs", "production-go-no-go-final-meeting.md"))) {
  issues.push("Ata final de go/no-go ausente: docs/production-go-no-go-final-meeting.md");
}

if (!existsSync(join("docs", "decisions", "production-webhook-decision-example.md"))) {
  issues.push("Exemplo de decisao ausente: docs/decisions/production-webhook-decision-example.md");
}

if (!existsSync(join("src", "app", "api", "meta", "webhook", "route.ts"))) {
  issues.push("Endpoint ausente: src/app/api/meta/webhook/route.ts");
}

const webhookProcessingSource = readFileSync(join("src", "lib", "meta", "webhook-processing.ts"), "utf8");
if (!webhookProcessingSource.includes('action: "quarantine"')) {
  issues.push("Regra de quarentena não encontrada no processamento de webhooks.");
}
if (!webhookProcessingSource.includes("Nenhum evento gera DM automática")) {
  issues.push("Guardrail de DM automática não documentado em webhook-processing.ts.");
}
if (!webhookProcessingSource.includes("Nenhum evento cria score político individual")) {
  issues.push("Guardrail de score político individual não documentado em webhook-processing.ts.");
}

if (!webhookProcessingSource.includes("Todo evento entra em quarentena primeiro")) {
  issues.push("Quarentena obrigatoria nao esta explicitada em webhook-processing.ts.");
}

const webhookRouteSource = readFileSync(join("src", "app", "api", "meta", "webhook", "route.ts"), "utf8");
if (!webhookRouteSource.includes("isWebhookEnabled()")) {
  issues.push("Endpoint de webhook sem gate explicito de habilitacao.");
}

if (/META_WEBHOOK_ENABLED\s*=\s*["']true["']/.test(webhookRouteSource)) {
  issues.push("Ativacao automatica direta de producao detectada no endpoint de webhook.");
}

if (process.env.META_WEBHOOK_ENABLED === "true") {
  warnings.push("META_WEBHOOK_ENABLED=true no ambiente atual. Validar que isto nao representa ativacao automatica de producao.");
}

if ((process.env.META_WEBHOOK_ENABLED ?? "false").trim() !== "false") {
  issues.push("META_WEBHOOK_ENABLED precisa ficar false em producao shadow.");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) issues.push("NEXT_PUBLIC_SUPABASE_URL ausente.");
if (!(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  issues.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.");
}
if (!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  issues.push("SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY ausente.");
}
if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") issues.push("NEXT_PUBLIC_USE_MOCKS precisa ficar inativo para produção.");
if ((process.env.NEXT_PUBLIC_USE_MOCKS ?? "false").trim() !== "false") issues.push("NEXT_PUBLIC_USE_MOCKS precisa ser false em producao shadow.");
if (process.env.E2E_BYPASS_AUTH === "true") issues.push("E2E_BYPASS_AUTH não pode ficar ativo para produção.");
if (!process.env.META_ACCESS_TOKEN) warnings.push("META_ACCESS_TOKEN ausente.");
if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) warnings.push("INSTAGRAM_BUSINESS_ACCOUNT_ID ausente.");

const protectedInternalPages = [
  "src/app/dashboard/page.tsx",
  "src/app/integracoes/meta/page.tsx",
  "src/app/operacao/page.tsx",
  "src/app/operacao/meta-reconciliacao/page.tsx",
  "src/app/radar/silencios/page.tsx",
  "src/app/radar/silencios/acoes/page.tsx",
  "src/app/radar/silencios/impacto/page.tsx",
  "src/app/campo/page.tsx",
  "src/app/voluntarios/page.tsx",
  "src/app/voluntarios/inscricoes/page.tsx",
  "src/app/voluntarios/revisao-periodica/page.tsx",
];

for (const pagePath of protectedInternalPages) {
  const source = readFileSync(pagePath, "utf8");
  if (!source.includes("requireInternalPageSession") && !source.includes("requireRole(")) {
    issues.push(`Rota interna sem gate explicito de autenticacao: ${pagePath}`);
  }
}

const volunteerExportSource = readFileSync(join("src", "lib", "data", "volunteers.ts"), "utf8");
if (!volunteerExportSource.includes('if (includeContact && role !== "admin")')) {
  issues.push("Exportacao de voluntarios sem gate explicito de contato por admin.");
}

const volunteerApplicationExportSource = readFileSync(join("src", "lib", "data", "volunteer-applications.ts"), "utf8");
if (!volunteerApplicationExportSource.includes('if (includeContact && role !== "admin")')) {
  issues.push("Exportacao de inscricoes sem gate explicito de contato por admin.");
}

const contactsExportRouteSource = readFileSync(join("src", "app", "api", "contacts", "export", "route.ts"), "utf8");
if (!contactsExportRouteSource.includes("canExportContacts")) {
  issues.push("Exportacao de contatos sem gate explicito de admin.");
}

if (!existsSync(join(".next", "BUILD_ID"))) {
  const buildResult = spawnSync("npm", ["run", "build"], {
    stdio: "inherit",
    shell: true,
  });
  if ((buildResult.status ?? 1) !== 0) {
    issues.push("Falha ao gerar build local durante readiness.");
  }
}

async function waitForHealth(url, attempts = 60) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // espera próxima tentativa
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Healthcheck local não respondeu a tempo.");
}

function stopServer(server) {
  if (!server?.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
      shell: true,
    });
    return;
  }
  server.kill("SIGTERM");
}

function readJsonIfPresent(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function findSensitiveMarkers(text) {
  return sensitiveMarkers.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

function findSecretValues(text) {
  const findings = [];
  for (const key of secretEnvKeys) {
    const value = process.env[key]?.trim();
    if (value && value.length > 8 && text.includes(value)) findings.push(key);
  }
  if (/sb_(publishable|secret)_[a-z0-9._-]+/i.test(text)) findings.push("supabase_token_shape");
  if (/eyJhbGciOi[0-9A-Za-z._-]+/.test(text)) findings.push("jwt_shape");
  return findings;
}

function findPii(text) {
  const findings = [];
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) findings.push("email_shape");
  if (/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9\d{4}[-\s]?\d{4}\b/.test(text)) findings.push("phone_shape");
  return findings;
}

const port = process.env.READINESS_PORT ?? "3200";
const server = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", port], {
  stdio: "pipe",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: "production",
    E2E_BYPASS_AUTH: "false",
  },
});

let healthResponse;

try {
  healthResponse = await waitForHealth(`http://127.0.0.1:${port}/api/health`);
  const body = await healthResponse.text();
  if (findSensitiveMarkers(body).length > 0) issues.push("Healthcheck expôs marcador sensível.");
  if (findSecretValues(body).length > 0) issues.push("Healthcheck expôs valor sensível.");
  if (findPii(body).length > 0) issues.push("Healthcheck expôs PII.");
} catch (error) {
  issues.push(error instanceof Error ? error.message : "Falha ao validar /api/health em readiness.");
} finally {
  stopServer(server);
}

const finalDecisionValidation = readJsonIfPresent(join("reports", "production-final-decision-validation.json"));
if (!finalDecisionValidation) {
  warnings.push("Sem reports/production-final-decision-validation.json. Producao deve permanecer bloqueada ate validacao final da ata.");
} else {
  const shouldRemainBlocked =
    !finalDecisionValidation.meeting_exists ||
    finalDecisionValidation.is_draft ||
    finalDecisionValidation.status === "BLOCKED_DRAFT" ||
    finalDecisionValidation.status === "BLOCKED_INCOMPLETE" ||
    finalDecisionValidation.status === "BLOCKED_RISK" ||
    finalDecisionValidation.decision === "NO_GO_PRODUCTION" ||
    finalDecisionValidation.decision === "POSTPONE" ||
    (finalDecisionValidation.decision === "GO_PRODUCTION" && finalDecisionValidation.status !== "VALID_GO_PRODUCTION");

  if (shouldRemainBlocked && finalDecisionValidation.production_authorized) {
    issues.push("Inconsistencia: ata final bloqueada, mas production_authorized=true.");
  }

  if (!shouldRemainBlocked && finalDecisionValidation.status === "VALID_GO_PRODUCTION" && !finalDecisionValidation.production_authorized) {
    issues.push("Inconsistencia: GO_PRODUCTION valido sem production_authorized no validador final.");
  }

  if (shouldRemainBlocked) {
    warnings.push(`Producao segue bloqueada pela ata final (${finalDecisionValidation.status}).`);
  }
}

if (warnings.length > 0) {
  for (const warning of warnings) {
    console.warn(`[readiness] aviso: ${warning}`);
  }
}

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[readiness] erro: ${issue}`);
  }
  process.exit(1);
}

console.log("[readiness] Produção pronta para validação final sem expor segredos no healthcheck.");
