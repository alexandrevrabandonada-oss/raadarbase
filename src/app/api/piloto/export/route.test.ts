import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  client: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({ requireInternalSession: mocks.session }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: mocks.client }));

import { GET } from "./route";

describe("GET /api/piloto/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia exportação sem sessão interna", async () => {
    mocks.session.mockRejectedValue(new Error("Usuário interno não autenticado."));

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("consulta a base somente após autenticar", async () => {
    mocks.session.mockResolvedValue({ id: "operator-1" });
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn(() => ({ order }));
    mocks.client.mockReturnValue({ from: vi.fn(() => ({ select })) });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.client).toHaveBeenCalledOnce();
  });
});
