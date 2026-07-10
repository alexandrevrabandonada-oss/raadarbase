import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), list: vi.fn(), detail: vi.fn(), relations: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/radar-hub/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/radar-hub/data")>();
  return { ...actual, listRadarEntities: mocks.list, getRadarEntityDetail: mocks.detail, listRadarRelationships: mocks.relations };
});
import { GET } from "./route";

describe("GET /api/radar/entities", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ id: "user-1", email: "admin@example.com", internalUser: { role: "admin" } }); mocks.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, totalPages: 1, kpis: {}, facets: {} }); });
  it("retorna busca autenticada com filtros normalizados", async () => { const response = await GET(new NextRequest("http://localhost/api/radar/entities?q=demo&entityType=company&minScore=50")); expect(response.status).toBe(200); expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ q: "demo", entityType: "company", minScore: 50 })); });
  it("exporta JSON e registra auditoria", async () => { const response = await GET(new NextRequest("http://localhost/api/radar/entities?format=json")); expect(response.headers.get("content-disposition")).toContain("radar-entities.json"); expect(mocks.audit).toHaveBeenCalledOnce(); });
  it("converte sessão ausente em 401", async () => { mocks.session.mockRejectedValue(new Error("Usuário interno não autenticado.")); expect((await GET(new NextRequest("http://localhost/api/radar/entities"))).status).toBe(401); });
});
