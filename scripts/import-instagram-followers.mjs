import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, ".env.local");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/import-instagram-followers.mjs <file.csv> [more.csv...]");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

function normalizeUsername(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

function normalizeInstagramUserId(value) {
  const cleaned = String(value ?? "").trim();
  return /^\d+$/.test(cleaned) ? cleaned : null;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

const peopleByUsername = new Map();
let rawRows = 0;

for (const file of files) {
  const absolute = path.resolve(file);
  const content = fs.readFileSync(absolute, "utf8").replace(/^\uFEFF/, "");
  const lines = content.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]).map((cell) => cell.trim());
  const indexes = {
    id: header.indexOf("id"),
    userName: header.indexOf("userName"),
    fullName: header.indexOf("fullName"),
    profileUrl: header.indexOf("profileUrl"),
  };

  if (indexes.userName === -1) {
    throw new Error(`Missing userName column in ${absolute}`);
  }

  for (const line of lines.slice(1)) {
    rawRows += 1;
    const cells = parseCsvLine(line);
    const username = normalizeUsername(cells[indexes.userName]);
    if (!username || username.length > 30) continue;
    if (peopleByUsername.has(username)) continue;
    peopleByUsername.set(username, {
      instagram_user_id: indexes.id >= 0 ? normalizeInstagramUserId(cells[indexes.id]) : null,
      username,
      display_name: indexes.fullName >= 0 ? String(cells[indexes.fullName] ?? "").trim() || null : null,
      profile_url: indexes.profileUrl >= 0 ? String(cells[indexes.profileUrl] ?? "").trim() || null : null,
    });
  }
}

const rows = Array.from(peopleByUsername.values());
console.log(`Parsed ${rawRows} rows; ${rows.length} unique usernames.`);

const existingByUsername = new Map();
for (const usernames of chunk(rows.map((row) => row.username), 500)) {
  const { data, error } = await supabase
    .from("ig_people")
    .select("id, username, instagram_user_id, status, do_not_contact_reason")
    .in("username", usernames);
  if (error) throw error;
  for (const row of data ?? []) existingByUsername.set(row.username, row);
}

const now = new Date().toISOString();
const importNote = `Origem: CSV de seguidores importado manualmente em ${now.slice(0, 10)}.`;
const inserts = [];
const updates = [];
let protectedCount = 0;

for (const row of rows) {
  const existing = existingByUsername.get(row.username);
  if (existing) {
    if (existing.status === "nao_abordar" || existing.do_not_contact_reason) {
      protectedCount += 1;
    }
    continue;
  }

  inserts.push({
    instagram_user_id: row.instagram_user_id,
    username: row.username,
    display_name: row.display_name,
    status: "novo",
    themes: ["seguidor_instagram"],
    notes: row.profile_url ? `${importNote} Perfil: ${row.profile_url}` : importNote,
    total_interactions: 0,
    last_interaction_at: null,
    do_not_contact_reason: null,
    created_at: now,
    updated_at: now,
  });
}

let inserted = 0;
let updated = 0;

for (const batch of chunk(inserts, 500)) {
  const { error } = await supabase.from("ig_people").insert(batch);
  if (error) throw error;
  inserted += batch.length;
  console.log(`Inserted ${inserted}/${inserts.length}`);
}

for (const batch of chunk(updates, 500)) {
  for (const update of batch) {
    const { id, ...payload } = update;
    const { error } = await supabase.from("ig_people").update(payload).eq("id", id);
    if (error) throw error;
    updated += 1;
  }
  console.log(`Updated ${updated}/${updates.length}`);
}

const { count, error: countError } = await supabase
  .from("ig_people")
  .select("*", { count: "exact", head: true });
if (countError) throw countError;

console.log(JSON.stringify({ rawRows, uniqueUsernames: rows.length, inserted, updated, protectedCount, totalPeople: count }, null, 2));
