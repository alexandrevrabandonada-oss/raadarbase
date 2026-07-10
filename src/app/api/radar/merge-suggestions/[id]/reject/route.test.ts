import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), review: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/radar-hub/service", () => ({ reviewMergeSuggestion: mocks.review }));
import { POST } from "./route";

describe("POST /api/radar/merge-suggestions/:id/reject", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ id: "user-1", email: "admin@example.com", internalUser: { role: "admin" } }); mocks.review.mockResolvedValue({ status: "rejected" }); });
  it("registra rejeição humana sem mesclar", async () => { const id = "56400000-0000-4000-8000-000000000001"; const response = await POST(new NextRequest(`http://localhost/api/radar/merge-suggestions/${id}/reject`, { method: "POST" }), { params: Promise.resolve({ id }) }); expect(response.status).toBe(200); expect(mocks.review).toHaveBeenCalledWith(id, "rejected", expect.any(Object)); expect(mocks.audit).toHaveBeenCalledOnce(); });
});
