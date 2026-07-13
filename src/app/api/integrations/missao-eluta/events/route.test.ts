import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  process.env.MISSAO_ELUTA_WEBHOOK_SECRET = "audit-secret";
  return { client: vi.fn() };
});

vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: mocks.client }));

import { POST } from "./route";

function webhookRequest(body: string, authorization = "Bearer audit-secret") {
  return new NextRequest("https://radardabase.online/api/integrations/missao-eluta/events", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body,
  });
}

describe("POST /api/integrations/missao-eluta/events", () => {
  it("bloqueia segredo inválido antes de acessar o banco", async () => {
    const response = await POST(webhookRequest("{}", "Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("rejeita JSON inválido", async () => {
    const response = await POST(webhookRequest("not-json"));

    expect(response.status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("rejeita tipos de evento não suportados", async () => {
    const response = await POST(webhookRequest(JSON.stringify({
      event_type: "unknown_event",
      instagram_handle: "perfil",
    })));

    expect(response.status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("rejeita payloads acima do limite", async () => {
    const response = await POST(webhookRequest("x".repeat(256 * 1024 + 1)));

    expect(response.status).toBe(413);
    expect(mocks.client).not.toHaveBeenCalled();
  });
});
