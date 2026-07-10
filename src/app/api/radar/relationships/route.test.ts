import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), list: vi.fn(), create: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/radar-hub/data", () => ({ listRadarRelationships: mocks.list }));
vi.mock("@/lib/radar-hub/service", () => ({ createRadarRelationship: mocks.create }));
import { GET, POST } from "./route";

describe("/api/radar/relationships", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ id: "user-1", email: "admin@example.com", internalUser: { role: "admin" } }); mocks.list.mockResolvedValue({ items: [], entities: {}, depth: 1 }); mocks.create.mockResolvedValue({ id: "56300000-0000-4000-8000-000000000099", predicate: "member_of" }); });
  it("limita profundidade na consulta pelo serviço", async () => { const response = await GET(new NextRequest("http://localhost/api/radar/relationships?depth=3")); expect(response.status).toBe(200); expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ depth: 3 })); });
  it("valida e cria relação auditada", async () => { const request = new NextRequest("http://localhost/api/radar/relationships", { method: "POST", body: JSON.stringify({ subjectEntityId: "56000000-0000-4000-8000-000000000001", objectEntityId: "56000000-0000-4000-8000-000000000002", predicate: "member_of", confidence: .9 }), headers: { "content-type": "application/json" } }); const response = await POST(request); expect(response.status).toBe(201); expect(mocks.create).toHaveBeenCalledOnce(); expect(mocks.audit).toHaveBeenCalledOnce(); });
  it("rejeita predicado fora do contrato", async () => { const request = new NextRequest("http://localhost/api/radar/relationships", { method: "POST", body: JSON.stringify({ subjectEntityId: "56000000-0000-4000-8000-000000000001", objectEntityId: "56000000-0000-4000-8000-000000000002", predicate: "tracks_secretly", confidence: 1 }), headers: { "content-type": "application/json" } }); expect((await POST(request)).status).toBe(400); });
});
