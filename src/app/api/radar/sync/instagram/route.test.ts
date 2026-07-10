import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), sync: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/radar-hub/service", () => ({ syncInstagramProfilesToRadarEntities: mocks.sync }));
import { POST } from "./route";

describe("POST /api/radar/sync/instagram", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ id: "user-1", email: "admin@example.com", internalUser: { role: "admin" } }); mocks.sync.mockResolvedValue({ jobId: "job-1", total: 8, inserted: 3, updated: 5, rejected: 0, errors: [] }); });
  it("sincroniza a base interna e audita", async () => { const response = await POST(new NextRequest("http://localhost/api/radar/sync/instagram", { method: "POST" })); expect(response.status).toBe(200); expect((await response.json()).total).toBe(8); expect(mocks.audit).toHaveBeenCalledOnce(); });
  it("nega perfil sem permissão operacional", async () => { mocks.session.mockResolvedValue({ id: "user-2", email: "viewer@example.com", internalUser: { role: "viewer" } }); expect((await POST(new NextRequest("http://localhost/api/radar/sync/instagram", { method: "POST" }))).status).toBe(403); });
});
