#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reportsDir = join(process.cwd(), "reports");
const outputPath = join(reportsDir, "production-role-audit.json");

const sourceFiles = {
  roles: "src/lib/authz/roles.ts",
  volunteerActions: "src/app/voluntarios/actions.ts",
  volunteerData: "src/lib/data/volunteers.ts",
  volunteerApplications: "src/lib/data/volunteer-applications.ts",
  fieldNewPage: "src/app/campo/novo/page.tsx",
  devolutionActions: "src/app/relatorios/[id]/devolutiva/actions.ts",
  webhookActions: "src/app/integracoes/meta/webhooks/actions.ts",
  incidentsActions: "src/app/operacao/incidentes/actions.ts",
  snapshotsExport: "src/app/api/escuta/bairro/snapshots/[id]/export/route.ts",
  receiptDistribution: "src/lib/data/public-receipt-distribution.ts",
};

const roleMatrix = {
  admin: [
    {
      capability: "exportar_contato_consentido",
      expectations: [
        { file: sourceFiles.volunteerData, pattern: 'if (includeContact && role !== "admin")' },
        { file: sourceFiles.volunteerApplications, pattern: 'if (includeContact && role !== "admin")' },
      ],
    },
    {
      capability: "aprovar_rejeitar_voluntarios",
      expectations: [{ file: sourceFiles.volunteerActions, pattern: 'requireRole(["admin", "operador"])' }],
    },
    {
      capability: "gerar_evidencias",
      expectations: [{ file: sourceFiles.snapshotsExport, pattern: 'requireRole(["admin", "operador", "comunicacao"])' }],
    },
    {
      capability: "processar_webhooks",
      expectations: [{ file: sourceFiles.webhookActions, pattern: '["admin", "operador"].includes(user.role)' }],
    },
    {
      capability: "arquivar_incidentes",
      expectations: [{ file: sourceFiles.incidentsActions, pattern: 'requireRole(["admin", "operador"])' }],
    },
  ],
  operador: [
    {
      capability: "revisar_temas",
      expectations: [{ file: "src/app/temas/actions.ts", pattern: 'requireRole(["admin", "operador"])' }],
    },
    {
      capability: "gerar_acoes",
      expectations: [{ file: "src/app/radar/silencios/actions.ts", pattern: 'requireRole(["admin", "operador"])' }],
    },
    {
      capability: "revisar_voluntarios",
      expectations: [{ file: sourceFiles.volunteerActions, pattern: 'requireRole(["admin", "operador"])' }],
    },
    {
      capability: "criar_campo",
      expectations: [{ file: sourceFiles.fieldNewPage, pattern: 'requireRole(["admin", "operador", "comunicacao"])' }],
    },
    {
      capability: "gerar_snapshots",
      expectations: [{ file: sourceFiles.snapshotsExport, pattern: 'requireRole(["admin", "operador", "comunicacao"])' }],
    },
    {
      capability: "sem_export_irrestrito_contato",
      expectations: [
        { file: sourceFiles.volunteerData, pattern: 'if (includeContact && role !== "admin")' },
        { file: sourceFiles.volunteerApplications, pattern: 'if (includeContact && role !== "admin")' },
      ],
    },
  ],
  comunicacao: [
    {
      capability: "ver_relatorios",
      expectations: [{ file: sourceFiles.devolutionActions, pattern: 'requireRole(["admin", "operador", "comunicacao"])' }],
    },
    {
      capability: "gerar_kit",
      expectations: [{ file: sourceFiles.devolutionActions, pattern: 'requireRole(["admin", "operador", "comunicacao"])' }],
    },
    {
      capability: "sem_registro_distribuicao",
      expectations: [{ file: sourceFiles.receiptDistribution, pattern: 'requireRole(["admin", "operador"])' }],
    },
    {
      capability: "sem_acesso_amplo_contato",
      expectations: [{ file: sourceFiles.roles, pattern: 'return role === "admin" || role === "operador";' }],
    },
  ],
  leitura: [
    {
      capability: "apenas_visualizacao_interna",
      expectations: [
        { file: sourceFiles.roles, pattern: 'return ["admin", "operador", "comunicacao", "leitura"].includes(role);' },
        { file: sourceFiles.roles, pattern: 'return role === "admin";' },
      ],
    },
  ],
};

function read(path) {
  return readFileSync(path, "utf8");
}

function evaluateCapability(capability) {
  const evidence = capability.expectations.map((expectation) => {
    const fileText = read(expectation.file);
    return {
      file: expectation.file,
      matched: fileText.includes(expectation.pattern),
    };
  });
  return {
    capability: capability.capability,
    evidence,
    ok: evidence.every((item) => item.matched),
  };
}

async function main() {
  const results = Object.entries(roleMatrix).map(([role, capabilities]) => ({
    role,
    capabilities: capabilities.map(evaluateCapability),
  }));

  const failures = [];
  for (const role of results) {
    for (const capability of role.capabilities) {
      if (!capability.ok) failures.push(`Evidência ausente para ${role.role}:${capability.capability}.`);
    }
  }

  const findings = {
    rolesChecked: results.length,
    failedCapabilities: results.reduce(
      (count, role) => count + role.capabilities.filter((capability) => !capability.ok).length,
      0,
    ),
  };

  const recommendation = findings.failedCapabilities > 0 ? "NEEDS_FIX" : "ACCESS_READY";

  const payload = {
    generatedAt: new Date().toISOString(),
    matrix: results,
    findings,
    failures,
    recommendation,
    productionAuthorized: false,
  };

  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("[production:role-audit]");
  console.log(`- roles_checked: ${findings.rolesChecked}`);
  console.log(`- failed_capabilities: ${findings.failedCapabilities}`);
  console.log(`- recommendation: ${recommendation}`);

  if (recommendation !== "ACCESS_READY") process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[production:role-audit] erro: ${error instanceof Error ? error.message : "falha desconhecida"}`);
  process.exit(1);
});
