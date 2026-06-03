import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BundledSchema, ValidationError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthToken } from "../../../src/auth/services/resolve-token.js";
import { BINARY_TTY_ERROR } from "../../../src/platform/write-binary.js";
import { createScreenshotCommand } from "../../../src/scrape/commands/screenshot.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0JEQVQImWP4GwADAwEAAv6C7p4AAAAASUVORK5CYII=";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  requireAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

describe("createScreenshotCommand", () => {
  let exitCode: number | undefined;
  let stderr: string[];
  let stdoutBytes: Buffer | undefined;

  beforeEach(() => {
    exitCode = undefined;
    stderr = [];
    stdoutBytes = undefined;

    vi.mocked(requireAuthToken).mockResolvedValue("test-token");
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, "log").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation((message) => {
      stderr.push(String(message));
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdoutBytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockScrapeWithPng(): ReturnType<typeof vi.fn> {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: MINIMAL_PNG_BASE64 }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);
    return scrape;
  }

  it("posts tier-1 screenshot body and writes PNG to file", async () => {
    const scrape = mockScrapeWithPng();
    const dir = mkdtempSync(join(tmpdir(), "decodo-screenshot-"));
    const path = join(dir, "shot.png");

    try {
      const program = new Command()
        .option("--token <token>")
        .addCommand(createScreenshotCommand(BundledSchema.shared));

      await program.parseAsync(
        [
          "screenshot",
          "https://example.com",
          "-o",
          path,
          "--token",
          "test-token",
        ],
        { from: "user" }
      );

      expect(scrape).toHaveBeenCalledWith({
        target: "universal",
        url: "https://example.com",
        headless: "png",
      });
      expect(readFileSync(path).subarray(0, 8).toString("hex")).toBe(
        "89504e470d0a1a0a"
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("maps --country to geo", async () => {
    const scrape = mockScrapeWithPng();
    const dir = mkdtempSync(join(tmpdir(), "decodo-screenshot-"));
    const path = join(dir, "shot.png");

    try {
      const program = new Command()
        .option("--token <token>")
        .addCommand(createScreenshotCommand(BundledSchema.shared));

      await program.parseAsync(
        [
          "screenshot",
          "https://example.com",
          "--country",
          "us",
          "-o",
          path,
          "--token",
          "test-token",
        ],
        { from: "user" }
      );

      expect(scrape).toHaveBeenCalledWith({
        target: "universal",
        url: "https://example.com",
        headless: "png",
        geo: "us",
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("writes PNG to stdout when piped", async () => {
    mockScrapeWithPng();
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });

    const program = new Command()
      .option("--token <token>")
      .addCommand(createScreenshotCommand(BundledSchema.shared));

    await program.parseAsync(
      ["screenshot", "https://example.com", "--token", "test-token"],
      { from: "user" }
    );

    expect(stdoutBytes?.subarray(0, 8).toString("hex")).toBe(
      "89504e470d0a1a0a"
    );
  });

  it("refuses TTY stdout without -o", async () => {
    mockScrapeWithPng();
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      configurable: true,
    });

    const program = new Command()
      .option("--token <token>")
      .addCommand(createScreenshotCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(
        ["screenshot", "https://example.com", "--token", "test-token"],
        { from: "user" }
      )
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
    expect(stderr.join("\n")).toContain(BINARY_TTY_ERROR);
    expect(stdoutBytes).toBeUndefined();
  });

  it("maps validation errors to usage exit code", async () => {
    const scrape = vi
      .fn()
      .mockRejectedValue(new ValidationError("invalid params"));
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createScreenshotCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(
        [
          "screenshot",
          "https://example.com",
          "-o",
          "/tmp/x.png",
          "--token",
          "test-token",
        ],
        { from: "user" }
      )
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });

  it("maps unknown target to usage exit code", async () => {
    const program = new Command()
      .option("--token <token>")
      .addCommand(createScreenshotCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(
        [
          "screenshot",
          "https://example.com",
          "--target",
          "not-a-target",
          "--token",
          "test-token",
        ],
        { from: "user" }
      )
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });

  it("maps invalid PNG content to usage exit code", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: Buffer.from("not-png").toString("base64") }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createScreenshotCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(
        [
          "screenshot",
          "https://example.com",
          "-o",
          "/tmp/x.png",
          "--token",
          "test-token",
        ],
        { from: "user" }
      )
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });
});
