import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";

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

// O build anterior usa configuração real. O servidor E2E precisa recompilar
// os módulos públicos com o modo demo explicitamente isolado abaixo.
rmSync(".next", { recursive: true, force: true });

const playwrightArgs = ["playwright", "test"];
if (!process.argv.includes("--full")) {
  playwrightArgs.push("e2e/influencia.spec.ts", "e2e/inteligencia.spec.ts");
}

const testResult = spawnSync("npx", playwrightArgs, {
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
