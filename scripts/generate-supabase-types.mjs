import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvLocal() {
  try {
    const text = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    text.split(/\r?\n/).forEach(line => {
      const idx = line.indexOf("=");
      if (idx <= 0) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    });
  } catch {
    // Ignore if file not found
  }
}

loadEnvLocal();

const projectId = process.env.SUPABASE_PROJECT_ID ?? "blimjnitngthldhazvwh";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error("SUPABASE_ACCESS_TOKEN is required to generate types.");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["supabase", "gen", "types", "typescript", "--project-id", projectId, "--schema", "public"],
  {
    shell: true,
    encoding: "utf8",
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
  },
);

if (result.status !== 0) {
  console.error(result.stderr || "Failed to generate Supabase types.");
  process.exit(result.status ?? 1);
}

writeFileSync("src/lib/supabase/database.types.ts", result.stdout, "utf8");
console.log("Supabase types written to src/lib/supabase/database.types.ts");
