import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), createJob: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/audit/write-audit-log", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/radar-hub/service", () => ({ createEnrichmentJob: mocks.createJob }));
import { POST } from "./route";

describe("POST /api/radar/entities/enrich", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ id: "user-1", email: "admin@example.com", internalUser: { role: "admin" } }); mocks.createJob.mockResolvedValue({ id: "job-1", status: "queued" }); });
  it("cria job seguro assíncrono", async () => { const request = new NextRequest("http://localhost/api/radar/entities/enrich", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entityIds: ["56000000-0000-4000-8000-000000000001"], sourceTypes: ["radar_base"], mode: "safe", processNow: false }) }); const response = await POST(request); expect(response.status).toBe(202); expect(mocks.createJob).toHaveBeenCalledWith(expect.objectContaining({ mode: "safe", processNow: false }), expect.objectContaining({ id: "user-1" })); });
});
