import { describe, expect, it } from "vitest";
import { shouldKeepOfflineTaskForRetry } from "./offline-retry-policy";

describe("offline retry policy", () => {
  it("keeps transient server failures for retry", () => {
    expect(shouldKeepOfflineTaskForRetry("Falha ao confirmar envio de DM.")).toBe(true);
    expect(shouldKeepOfflineTaskForRetry("Network timeout")).toBe(true);
    expect(shouldKeepOfflineTaskForRetry("Supabase temporariamente indisponível")).toBe(true);
  });

  it("does not retry validation or authorization failures indefinitely", () => {
    expect(shouldKeepOfflineTaskForRetry("Pessoa inválida.")).toBe(false);
    expect(shouldKeepOfflineTaskForRetry("Permissão insuficiente.")).toBe(false);
  });
});
