import { afterEach, describe, expect, it, vi } from "vitest";
import { assertNoUnsafeProductionConfig, getUnsafeProductionWarnings } from "@/lib/security/production-guards";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe("production guards", () => {
  it("reports blocking warnings for unsafe production config", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("E2E_BYPASS_AUTH", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const warnings = getUnsafeProductionWarnings();

    expect(warnings.some((warning) => warning.code === "E2E_BYPASS_AUTH_IN_PRODUCTION")).toBe(true);
    expect(warnings.some((warning) => warning.code === "MOCK_MODE_IN_PRODUCTION")).toBe(true);
    expect(warnings.some((warning) => warning.code === "SUPABASE_SERVICE_ROLE_KEY_MISSING")).toBe(true);
  });

  it("throws when blocking warnings exist", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("E2E_BYPASS_AUTH", "true");

    expect(() => assertNoUnsafeProductionConfig()).toThrow(/E2E_BYPASS_AUTH/);
  });
});