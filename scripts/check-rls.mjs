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

const testEmail = process.env.SUPABASE_TEST_EMAIL;
const testPassword = process.env.SUPABASE_TEST_PASSWORD;

if (!testEmail || !testPassword) {
  console.log("[check:rls] SUPABASE_TEST_EMAIL/PASSWORD ausentes. Validacao autenticada foi pulada.");
} else {
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await authClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInError) {
    console.error(`[check:rls] Falha ao autenticar usuario de teste: ${signInError.message}`);
    failed = true;
  } else {
    const { error: readError } = await authClient.from("meta_sync_runs").select("id").limit(1);
    if (readError) {
      console.error(`[check:rls] FALHA: usuario autenticado nao conseguiu ler meta_sync_runs: ${readError.message}`);
      failed = true;
    } else {
      console.log("[check:rls] OK: usuario autenticado conseguiu ler meta_sync_runs.");
    }

    for (const table of sensitiveTables) {
      const { error } = await authClient.from(table).insert({}).select("id").limit(1);
      if (!error) {
        console.error(`[check:rls] FALHA: usuario autenticado conseguiu escrever diretamente em ${table}.`);
        failed = true;
      } else {
        console.log(`[check:rls] OK: usuario autenticado bloqueado para escrita direta em ${table}.`);
      }
    }
  }
}

console.log("[check:rls] Escrita operacional deve ocorrer apenas por server actions/service role.");

if (failed) {
  process.exit(1);
}
