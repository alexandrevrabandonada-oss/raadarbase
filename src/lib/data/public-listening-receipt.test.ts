import { describe, it, expect, vi } from "vitest";
import { getPublicListeningReceipt } from "./public-listening-receipt";

vi.mock("@/lib/config", () => ({
  shouldUseMockData: () => true,
}));

describe("public-listening-receipt", () => {
  it("returns safe mock data when mock mode is enabled", async () => {
    const receipt = await getPublicListeningReceipt();

    expect(receipt.periodStart).toBeTruthy();
    expect(receipt.actions.totalActions).toBeGreaterThanOrEqual(0);
    expect(receipt.timeSeries.trend).toBeTruthy();

    // Ensure no obvious PII fields are on the root structure
    const receiptData = receipt as unknown as Record<string, unknown>;
    expect(receiptData.name).toBeUndefined();
    expect(receiptData.email).toBeUndefined();
    expect(receiptData.telefone).toBeUndefined();
    expect(receiptData.comments).toBeUndefined();
  });
});
