const url = process.env.HEALTHCHECK_URL;

if (!url) {
  console.log("[check:health] HEALTHCHECK_URL ausente. Pulando healthcheck HTTP local.");
  process.exit(0);
}

const response = await fetch(url);
if (!response.ok) {
  console.error(`[check:health] Healthcheck falhou com status ${response.status}.`);
  process.exit(1);
}

const body = await response.text();
const forbidden = [
  process.env.META_ACCESS_TOKEN,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
].filter(Boolean);

for (const secret of forbidden) {
  if (body.includes(secret)) {
    console.error("[check:health] Segredo encontrado no payload de healthcheck.");
    process.exit(1);
  }
}

console.log("[check:health] Healthcheck respondeu sem segredos conhecidos.");
