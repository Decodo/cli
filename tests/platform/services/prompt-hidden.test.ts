import { stdin } from "node:process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promptHidden } from "../../../src/platform/services/prompt-hidden.js";

vi.mock("node:readline/promises", () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn().mockResolvedValue(" piped-token "),
    close: vi.fn(),
  })),
}));

describe("promptHidden", () => {
  beforeEach(() => {
    Object.defineProperty(stdin, "isTTY", { configurable: true, value: false });
  });

  afterEach(() => {
    Object.defineProperty(stdin, "isTTY", { configurable: true, value: true });
  });

  it("falls back to readline when stdin is not a TTY", async () => {
    await expect(promptHidden("Token: ")).resolves.toBe("piped-token");
  });
});
