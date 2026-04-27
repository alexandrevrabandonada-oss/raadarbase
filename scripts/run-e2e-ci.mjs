import { spawnSync } from "node:child_process";

if (process.env.NODE_ENV === "production" && process.env.E2E_BYPASS_AUTH === "true") {
  console.error("[e2e:ci] E2E_BYPASS_AUTH não pode ficar ativo com NODE_ENV=production.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
  console.error("[e2e:ci] NEXT_PUBLIC_USE_MOCKS não pode ficar ativo em produção.");
  process.exit(1);
}

const installResult = spawnSync("npx", ["playwright", "install", "chromium"], {
  stdio: "inherit",
  shell: true,
});

if ((installResult.status ?? 1) !== 0) {
  process.exit(installResult.status ?? 1);
}

const testResult = spawnSync("npx", ["playwright", "test"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: "test",
    E2E_BYPASS_AUTH: "true",
    E2E_TEST_MODE: "true",
    NEXT_PUBLIC_USE_MOCKS: "true",
  },
});

process.exit(testResult.status ?? 1);