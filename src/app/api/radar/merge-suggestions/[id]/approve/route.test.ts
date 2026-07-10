import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), review: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/radar-hub/service", () => ({ reviewMergeSuggestion: mocks.review }));
import { POST } from "./route";

describe("POST /api/radar/merge-suggestions/:id/approve", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ id: "user-1", email: "admin@example.com", internalUser: { role: "admin" } }); mocks.review.mockResolvedValue({ id: "56400000-0000-4000-8000-000000000001", status: "approved" }); });
  it("exige decisão humana autenticada e registra auditoria", async () => { const id = "56400000-0000-4000-8000-000000000001"; const response = await POST(new NextRequest(`http://localhost/api/radar/merge-suggestions/${id}/approve`, { method: "POST" }), { params: Promise.resolve({ id }) }); expect(response.status).toBe(200); expect(mocks.review).toHaveBeenCalledWith(id, "approved", expect.objectContaining({ id: "user-1" })); expect(mocks.audit).toHaveBeenCalledOnce(); });
  it("rejeita identificador inválido", async () => { expect((await POST(new NextRequest("http://localhost/api/radar/merge-suggestions/x/approve", { method: "POST" }), { params: Promise.resolve({ id: "x" }) })).status).toBe(400); });
});
