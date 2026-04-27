import { spawnSync } from "node:child_process";

if (process.env.E2E_RUN !== "true") {
  console.log("[e2e] E2E_RUN=true ausente. Pulando testes E2E locais.");
  process.exit(0);
}

const result = spawnSync("npx", ["playwright", "test"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: "test",
    E2E_BYPASS_AUTH: "true",
    E2E_TEST_MODE: "true",
    NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS ?? "true",
  },
});

process.exit(result.status ?? 1);
