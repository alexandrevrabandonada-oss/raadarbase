import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

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
