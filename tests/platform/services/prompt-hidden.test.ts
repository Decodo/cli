import { stdin } from "node:process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promptHidden } from "../../../src/platform/services/prompt-hidden.js";

const { questionMock, closeListeners } = vi.hoisted(() => ({
  questionMock: vi.fn(),
  closeListeners: [] as Array<() => void>,
}));

vi.mock("node:readline/promises", () => ({
  createInterface: vi.fn(() => ({
    question: questionMock,
    close: vi.fn(),
    once: vi.fn((event: string, listener: () => void) => {
      if (event === "close") {
        closeListeners.push(listener);
      }
    }),
  })),
}));

describe("promptHidden", () => {
  beforeEach(() => {
    closeListeners.length = 0;
    questionMock.mockReset();
    Object.defineProperty(stdin, "isTTY", { configurable: true, value: false });
  });

  afterEach(() => {
    Object.defineProperty(stdin, "isTTY", { configurable: true, value: true });
  });

  it("falls back to readline when stdin is not a TTY", async () => {
    questionMock.mockResolvedValue(" piped-token ");

    await expect(promptHidden("Token: ")).resolves.toBe("piped-token");
  });

  it("rejects as a usage error when stdin closes with no input (EOF)", async () => {
    questionMock.mockReturnValue(new Promise<string>(() => undefined));

    const pending = promptHidden("Token: ");
    for (const listener of closeListeners) {
      listener();
    }

    await expect(pending).rejects.toThrow("No auth token provided on stdin.");
  });
});
