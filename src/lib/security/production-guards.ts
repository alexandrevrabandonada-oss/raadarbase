export type UnsafeProductionWarning = {
  code:
    | "E2E_BYPASS_AUTH_IN_PRODUCTION"
    | "MOCK_MODE_IN_PRODUCTION"
    | "SUPABASE_SERVICE_ROLE_KEY_MISSING"
    | "NEXT_PUBLIC_SUPABASE_URL_MISSING"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY_MISSING"
    | "META_ACCESS_TOKEN_MISSING"
    | "INSTAGRAM_BUSINESS_ACCOUNT_ID_MISSING";
  severity: "error" | "warning";
  message: string;
};

function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function getUnsafeProductionWarnings(): UnsafeProductionWarning[] {
  const warnings: UnsafeProductionWarning[] = [];
  const isProduction = isProductionEnvironment();

  if (isProduction && process.env.E2E_BYPASS_AUTH === "true") {
    warnings.push({
      code: "E2E_BYPASS_AUTH_IN_PRODUCTION",
      severity: "error",
      message: "E2E_BYPASS_AUTH ativo em produção.",
    });
  }

  if (isProduction && process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    warnings.push({
      code: "MOCK_MODE_IN_PRODUCTION",
      severity: "error",
      message: "NEXT_PUBLIC_USE_MOCKS ativo em produção.",
    });
  }

  if (isProduction && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push({
      code: "SUPABASE_SERVICE_ROLE_KEY_MISSING",
      severity: "error",
      message: "SUPABASE_SERVICE_ROLE_KEY ausente em produção.",
    });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    warnings.push({
      code: "NEXT_PUBLIC_SUPABASE_URL_MISSING",
      severity: isProduction ? "error" : "warning",
      message: "NEXT_PUBLIC_SUPABASE_URL ausente.",
    });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    warnings.push({
      code: "NEXT_PUBLIC_SUPABASE_ANON_KEY_MISSING",
      severity: isProduction ? "error" : "warning",
      message: "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.",
    });
  }

  if (!process.env.META_ACCESS_TOKEN) {
    warnings.push({
      code: "META_ACCESS_TOKEN_MISSING",
      severity: "warning",
      message: "META_ACCESS_TOKEN ausente.",
    });
  }

  if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    warnings.push({
      code: "INSTAGRAM_BUSINESS_ACCOUNT_ID_MISSING",
      severity: "warning",
      message: "INSTAGRAM_BUSINESS_ACCOUNT_ID ausente.",
    });
  }

  return warnings;
}

export function assertNoUnsafeProductionConfig() {
  const blockingWarnings = getUnsafeProductionWarnings().filter((warning) => warning.severity === "error");
  if (blockingWarnings.length > 0) {
    throw new Error(blockingWarnings.map((warning) => warning.message).join(" "));
  }
}