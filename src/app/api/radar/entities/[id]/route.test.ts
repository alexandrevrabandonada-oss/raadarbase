import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), detail: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/radar-hub/data", () => ({ getRadarEntityDetail: mocks.detail }));
import { GET } from "./route";

describe("GET /api/radar/entities/:id", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue({ id: "user-1", internalUser: { role: "admin" } }); mocks.detail.mockResolvedValue({ entity: { id: "56000000-0000-4000-8000-000000000001" }, evidence: [], relationships: [] }); });
  it("retorna ficha completa autenticada", async () => { const id = "56000000-0000-4000-8000-000000000001"; const response = await GET(new NextRequest(`http://localhost/api/radar/entities/${id}`), { params: Promise.resolve({ id }) }); expect(response.status).toBe(200); expect((await response.json()).entity.id).toBe(id); });
  it("rejeita ID inválido antes da consulta", async () => { expect((await GET(new NextRequest("http://localhost/api/radar/entities/x"), { params: Promise.resolve({ id: "x" }) })).status).toBe(400); });
});
