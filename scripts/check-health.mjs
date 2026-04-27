import { spawn } from "node:child_process";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const forbiddenMarkers = [
  "access_token",
  "service_role",
  "SUPABASE_SERVICE_ROLE_KEY",
  "META_ACCESS_TOKEN",
];

async function waitForHealth(url, attempts = 60) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // segue tentando
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

let url = process.env.HEALTHCHECK_URL;
let server;

if (!url) {
  const port = process.env.HEALTHCHECK_PORT ?? "3201";
  url = `http://127.0.0.1:${port}/api/health`;
  const command = existsSync(".next/BUILD_ID") ? "start" : "dev";
  server = spawn("npm", ["run", command, "--", "--hostname", "127.0.0.1", "--port", port], {
    stdio: "pipe",
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: command === "start" ? "production" : "test",
      E2E_BYPASS_AUTH: command === "start" ? "false" : "true",
      E2E_TEST_MODE: "true",
      NEXT_PUBLIC_USE_MOCKS: command === "start" ? "false" : process.env.NEXT_PUBLIC_USE_MOCKS ?? "true",
    },
  });
}

try {
  const response = await waitForHealth(url);
  if (!response.ok) {
    console.error(`[check:health] Healthcheck falhou com status ${response.status}.`);
    process.exit(1);
  }

  const body = await response.text();
  const forbidden = [
    process.env.META_ACCESS_TOKEN,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    ...forbiddenMarkers,
  ].filter(Boolean);

  for (const secret of forbidden) {
    if (body.includes(secret)) {
      console.error("[check:health] Segredo ou marcador sensível encontrado no payload de healthcheck.");
      process.exit(1);
    }
  }

  console.log("[check:health] Healthcheck respondeu sem segredos conhecidos.");
} finally {
  stopServer(server);
}
