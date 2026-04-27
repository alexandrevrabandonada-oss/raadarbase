import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

const state = vi.hoisted(() => ({
  internalUsers: [] as Row[],
  audits: [] as Row[],
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  requireAdminSession: async () => ({
    id: "admin-1",
    email: "admin@example.com",
    internalUser: { role: "admin" },
  }),
}));

vi.mock("@/lib/audit/write-audit-log", () => ({
  writeAuditLog: async (payload: Row) => {
    state.audits.push(payload);
  },
}));

function query(table: string) {
  const filters: { key: string; value: unknown }[] = [];
  let payload: Row | null = null;
  let operation: "select" | "update" = "select";
  const rows = table === "internal_users" ? state.internalUsers : [];

  const api = {
    select: () => api,
    update: (next: Row) => {
      operation = "update";
      payload = next;
      return api;
    },
    eq: (key: string, value: unknown) => {
      filters.push({ key, value });
      return api;
    },
    maybeSingle: async () => {
      const found = rows.find((row) => filters.every((filter) => row[filter.key] === filter.value)) ?? null;
      return { data: found, error: null };
    },
    then: async (resolve: (value: unknown) => unknown) => {
      if (operation === "update") {
        state.internalUsers = state.internalUsers.map((row) =>
          filters.every((filter) => row[filter.key] === filter.value) ? { ...row, ...(payload ?? {}) } : row,
        );
      }
      return resolve({ data: null, error: null });
    },
  };

  return api;
}

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => query(table),
  }),
}));

describe("configuracoes actions", () => {
  beforeEach(() => {
    state.internalUsers = [
      {
        id: "pending-user",
        email: "pending@example.com",
        status: "pending",
        role: "operator",
      },
      {
        id: "active-user",
        email: "active@example.com",
        status: "active",
        role: "operator",
      },
      {
        id: "admin-1",
        email: "admin@example.com",
        status: "active",
        role: "admin",
      },
    ];
    state.audits = [];
  });

  it("aprova usuario pendente e grava audit_log", async () => {
    const { approveInternalUserAction } = await import("./actions");

    const result = await approveInternalUserAction("pending-user");

    expect(result).toMatchObject({ ok: true, message: "Acesso liberado para pending@example.com." });
    expect(state.internalUsers.find((user) => user.id === "pending-user")).toMatchObject({
      status: "active",
      approved_by: "admin-1",
    });
    expect(state.audits).toMatchObject([
      {
        action: "internal_user.approved",
        metadata: expect.objectContaining({ previous_status: "pending", status: "active" }),
      },
    ]);
  });

  it("desativa usuario ativo e grava audit_log", async () => {
    const { disableInternalUserAction } = await import("./actions");

    const result = await disableInternalUserAction("active-user");

    expect(result).toMatchObject({ ok: true, message: "Acesso desativado para active@example.com." });
    expect(state.internalUsers.find((user) => user.id === "active-user")).toMatchObject({
      status: "disabled",
      approved_at: null,
      approved_by: null,
    });
    expect(state.audits).toMatchObject([
      {
        action: "internal_user.disabled",
        metadata: expect.objectContaining({ previous_status: "active", status: "disabled" }),
      },
    ]);
  });

  it("impede admin de desativar o proprio acesso", async () => {
    const { disableInternalUserAction } = await import("./actions");

    const result = await disableInternalUserAction("admin-1");

    expect(result).toMatchObject({ ok: false, error: "Você não pode desativar o seu próprio acesso por esta tela." });
    expect(state.internalUsers.find((user) => user.id === "admin-1")).toMatchObject({ status: "active" });
    expect(state.audits).toHaveLength(0);
  });
});