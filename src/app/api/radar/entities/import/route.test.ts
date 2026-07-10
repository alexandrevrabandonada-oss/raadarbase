import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), importEntities: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/radar-hub/service", () => ({ importRadarEntities: mocks.importEntities }));
import { POST } from "./route";

describe("POST /api/radar/entities/import", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ id: "user-1", email: "admin@example.com", internalUser: { role: "admin" } }); mocks.importEntities.mockResolvedValue({ jobId: "job-1", total: 1, inserted: 1, updated: 0, duplicates: 0, mergeSuggestions: 0, rejected: 0, errors: [] }); });
  it("aceita lote manual autenticado", async () => { const request = new NextRequest("http://localhost/api/radar/entities/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format: "manual", records: [{ name: "Entidade Demo" }] }) }); const response = await POST(request); expect(response.status).toBe(201); expect(mocks.importEntities).toHaveBeenCalledWith([{ name: "Entidade Demo" }], "manual", expect.objectContaining({ id: "user-1" }), null); expect(mocks.audit).toHaveBeenCalledOnce(); });
});
