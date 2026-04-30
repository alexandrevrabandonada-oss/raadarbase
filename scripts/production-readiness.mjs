import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const forbiddenStrings = [
  "access_token",
  "service_role",
  "SUPABASE_SERVICE_ROLE_KEY",
  "META_ACCESS_TOKEN",
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

const requiredScripts = ["lint", "build", "test", "check:health", "e2e:ci", "ci", "readiness", "verify", "staging:webhook:dry-run"];
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

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) issues.push("NEXT_PUBLIC_SUPABASE_URL ausente.");
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) issues.push("SUPABASE_SERVICE_ROLE_KEY ausente.");
if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") issues.push("NEXT_PUBLIC_USE_MOCKS precisa ficar inativo para produção.");
if (process.env.E2E_BYPASS_AUTH === "true") issues.push("E2E_BYPASS_AUTH não pode ficar ativo para produção.");
if (!process.env.META_ACCESS_TOKEN) warnings.push("META_ACCESS_TOKEN ausente.");
if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) warnings.push("INSTAGRAM_BUSINESS_ACCOUNT_ID ausente.");

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
  for (const forbidden of forbiddenStrings) {
    if (body.includes(forbidden)) {
      issues.push(`Healthcheck expôs marcador sensível: ${forbidden}`);
    }
  }
} catch (error) {
  issues.push(error instanceof Error ? error.message : "Falha ao validar /api/health em readiness.");
} finally {
  stopServer(server);
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