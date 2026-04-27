import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import permissionError from "./__fixtures__/meta-error-permission.json";
import tokenError from "./__fixtures__/meta-error-token.json";
import mediaSuccess from "./__fixtures__/media-success.json";

const ORIGINAL_ENV = process.env;

describe("meta client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.META_GRAPH_VERSION = "v23.0";
    process.env.META_ACCESS_TOKEN = "fake-secret-token";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "ig-account-1";
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("detecta Meta configurada", async () => {
    const { isMetaConfigured, getMetaConfigStatus } = await import("./client");
    expect(isMetaConfigured()).toBe(true);
    expect(getMetaConfigStatus()).toEqual({
      graphVersion: true,
      instagramBusinessAccountId: true,
      accessToken: true,
    });
  });

  it("retorna erro amigavel quando token esta ausente", async () => {
    delete process.env.META_ACCESS_TOKEN;
    const { isMetaConfigured, metaGet } = await import("./client");
    expect(isMetaConfigured()).toBe(false);
    await expect(metaGet("me")).resolves.toMatchObject({
      ok: false,
      code: "meta_not_configured",
    });
  });

  it("retorna erro amigavel quando conta esta ausente", async () => {
    delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const { isMetaConfigured, metaGet } = await import("./client");
    expect(isMetaConfigured()).toBe(false);
    await expect(metaGet("me")).resolves.toMatchObject({
      ok: false,
      code: "meta_not_configured",
    });
  });

  it("consulta posts validos com access_token apenas na URL server-side", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mediaSuccess,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { metaGet } = await import("./client");
    const result = await metaGet("ig-account-1/media", { limit: 2 });

    expect(result).toMatchObject({ ok: true, data: mediaSuccess });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get("access_token")).toBe("fake-secret-token");
  });

  it("redige token em erro 401/token invalido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => tokenError,
      }),
    );

    const { metaGet } = await import("./client");
    const result = await metaGet("ig-account-1/media");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.code).toBe("190");
      expect(result.message).not.toContain("fake-secret-token");
      expect(result.message).toContain("[redacted]");
    }
  });

  it("retorna erro de permissao sem segredo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => permissionError,
      }),
    );

    const { metaGet } = await import("./client");
    const result = await metaGet("ig-account-1/media");

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      code: "10",
    });
    if (!result.ok) expect(result.message).not.toContain("fake-secret-token");
  });
});
