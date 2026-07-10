import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ list: vi.fn(), session: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/influence/data", () => ({ listInfluenceProfiles: mocks.list }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: mocks.audit }));

import { GET } from "./route";

describe("GET /api/influencia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({ id: "user-1", email: "user@example.com", internalUser: { role: "admin" } });
    mocks.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, totalPages: 1, kpis: { totalProfiles: 0, totalFollowers: 0, averageFollowers: 0 }, cities: [] });
  });

  it("retorna consulta paginada autenticada", async () => {
    const response = await GET(new NextRequest("http://localhost/api/influencia?q=demo&page=2"));
    expect(response.status).toBe(200);
    expect((await response.json()).page).toBe(1);
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ query: "demo", page: 2 }));
  });

  it("propaga falha de autenticação como 401", async () => {
    mocks.session.mockRejectedValue(new Error("Usuário interno não autenticado."));
    const response = await GET(new NextRequest("http://localhost/api/influencia"));
    expect(response.status).toBe(401);
  });
});

