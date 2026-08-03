/** @vitest-environment jsdom */

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  persistInstagramSendPending,
  getInstagramConfirmationCustodyIds,
  useInstagramSendReturn,
  type InstagramSendReturnController,
} from "./use-instagram-send-return";
import {
  INSTAGRAM_RETURN_STORAGE_KEY,
  createPendingInstagramSend,
  markPendingInstagramSendAsAway,
} from "@/lib/instagram-return-flow";
import { executeOrQueueAction } from "@/lib/offline-queue";

vi.mock("@/lib/offline-queue", () => ({
  executeOrQueueAction: vi.fn(),
}));
vi.mock("@/lib/instagram-launch", () => ({
  launchInstagramProfile: vi.fn(),
}));

const executeMock = vi.mocked(executeOrQueueAction);
let root: Root | null = null;
let controller: InstagramSendReturnController | null = null;

function Harness({ onConfirmed = () => undefined }: { onConfirmed?: () => void }) {
  const value = useInstagramSendReturn({ enabled: false, onConfirmed });
  useEffect(() => {
    controller = value;
  }, [value]);
  return null;
}

async function renderHarness(onConfirmed?: () => void) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<Harness onConfirmed={onConfirmed} />);
  });
}

function seedPending(personId: string) {
  persistInstagramSendPending(markPendingInstagramSendAsAway(
    createPendingInstagramSend(personId, null, "lista_operacional", Date.now() - 1_000),
    Date.now() - 900,
  ));
}

describe("useInstagramSendReturn confirmation custody", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    persistInstagramSendPending(null);
    controller = null;
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    root = null;
    document.body.innerHTML = "";
  });

  it("keeps the pending send when neither server nor outbox accepts it", async () => {
    seedPending("person-failure");
    executeMock.mockResolvedValue({ ok: false, offline: false, error: "network" });
    await renderHarness();

    await act(async () => {
      await controller?.confirmNow();
    });

    expect(controller?.phase).toBe("error");
    expect(controller?.pendingPersonId).toBe("person-failure");
    expect(window.localStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY)).not.toBeNull();
  });

  it("deduplicates simultaneous lifecycle confirmations", async () => {
    seedPending("person-duplicate");
    let release: ((value: { ok: boolean; offline: boolean }) => void) | undefined;
    executeMock.mockImplementation(() => new Promise((resolve) => {
      release = resolve;
    }));
    const onConfirmed = vi.fn();
    await renderHarness(onConfirmed);

    let first: Promise<unknown> | undefined;
    let second: Promise<unknown> | undefined;
    await act(async () => {
      first = controller?.confirmNow();
      second = controller?.confirmNow();
      await Promise.resolve();
    });
    expect(executeMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      release?.({ ok: true, offline: false });
      await Promise.all([first, second]);
    });
    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY)).toBeNull();
  });

  it("clears the pending send after the outbox accepts offline custody", async () => {
    seedPending("person-offline");
    executeMock.mockResolvedValue({ ok: true, offline: true });
    await renderHarness();

    await act(async () => {
      await controller?.retryConfirmation();
    });

    expect(controller?.pendingPersonId).toBeNull();
    expect(getInstagramConfirmationCustodyIds()).toContain("person-offline");
    expect(window.sessionStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(INSTAGRAM_RETURN_STORAGE_KEY)).toBeNull();
  });
});
