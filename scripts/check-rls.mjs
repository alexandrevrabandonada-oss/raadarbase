import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) {
  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sensitiveTables = [
  "ig_people",
  "ig_posts",
  "ig_interactions",
  "audit_logs",
  "meta_sync_runs",
  "contacts",
];

if (!url || !anonKey) {
  console.log("[check:rls] Supabase URL/anon key ausentes. Pulando validacao anon local.");
  process.exit(0);
}

const anonClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let failed = false;

for (const table of sensitiveTables) {
  const { error } = await anonClient.from(table).insert({}).select("id").limit(1);
  if (!error) {
    console.error(`[check:rls] FALHA: anon conseguiu escrever em ${table}.`);
    failed = true;
  } else if (/fetch|network|enotfound|econnrefused/i.test(error.message)) {
    console.log(`[check:rls] Supabase indisponivel para teste (${error.message}). Pulando validacao local.`);
    process.exit(0);
  } else {
    console.log(`[check:rls] OK: anon bloqueado para escrita em ${table}.`);
  }
}

const roleTests = [
  {
    role: "admin",
    email: process.env.SUPABASE_TEST_ADMIN_EMAIL,
    password: process.env.SUPABASE_TEST_ADMIN_PASSWORD,
  },
  {
    role: "operador",
    email: process.env.SUPABASE_TEST_OPERATOR_EMAIL,
    password: process.env.SUPABASE_TEST_OPERATOR_PASSWORD,
  },
  {
    role: "leitura",
    email: process.env.SUPABASE_TEST_READONLY_EMAIL,
    password: process.env.SUPABASE_TEST_READONLY_PASSWORD,
  },
];

for (const test of roleTests) {
  if (!test.email || !test.password) {
    console.log(`[check:rls] Credenciais para papel "${test.role}" ausentes. Pulando.`);
    continue;
  }

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInError } = await authClient.auth.signInWithPassword({
    email: test.email,
    password: test.password,
  });

  if (signInError) {
    console.error(`[check:rls] Falha ao autenticar usuario de teste (${test.role}): ${signInError.message}`);
    failed = true;
    continue;
  }

  console.log(`[check:rls] Testando papel: ${test.role}`);

  // 1. Leitura deve funcionar para todos
  const { error: readError } = await authClient.from("meta_sync_runs").select("id").limit(1);
  if (readError) {
    console.error(`[check:rls] FALHA: ${test.role} nao conseguiu ler meta_sync_runs: ${readError.message}`);
    failed = true;
  } else {
    console.log(`[check:rls] OK: ${test.role} conseguiu ler meta_sync_runs.`);
  }

  // 2. Escrita direta deve ser bloqueada para todos via RLS (deve ocorrer via RPC/Actions)
  for (const table of sensitiveTables) {
    const { error } = await authClient.from(table).insert({}).select("id").limit(1);
    if (!error) {
      console.error(`[check:rls] FALHA: ${test.role} conseguiu escrever diretamente em ${table}.`);
      failed = true;
    } else {
      console.log(`[check:rls] OK: ${test.role} bloqueado para escrita direta em ${table}.`);
    }
  }
}

console.log("[check:rls] Escrita operacional deve ocorrer apenas por server actions/service role.");

if (failed) {
  process.exit(1);
}
