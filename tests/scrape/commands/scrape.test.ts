import { BundledSchema, ValidationError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthToken } from "../../../src/auth/services/resolve-token.js";
import { createScrapeCommand } from "../../../src/scrape/commands/scrape.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  requireAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

describe("createScrapeCommand", () => {
  let exitCode: number | undefined;
  let stdout: string | undefined;

  beforeEach(() => {
    exitCode = undefined;
    stdout = undefined;

    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });

    vi.mocked(requireAuthToken).mockResolvedValue("test-token");
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout = String(chunk);
      return true;
    });
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts tier-1 scrape body and prints markdown content", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: "# Example" }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createScrapeCommand(BundledSchema.shared));

    await program.parseAsync(
      ["scrape", "https://example.com", "--token", "test-token"],
      { from: "user" }
    );

    expect(scrape).toHaveBeenCalledWith({
      target: "universal",
      url: "https://example.com",
      markdown: true,
    });
    expect(stdout).toBe("# Example\n");
  });

  it("omits markdown in body when --format json", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: { ok: true } }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createScrapeCommand(BundledSchema.shared));

    await program.parseAsync(
      [
        "scrape",
        "https://example.com",
        "--format",
        "json",
        "--token",
        "test-token",
      ],
      { from: "user" }
    );

    expect(scrape).toHaveBeenCalledWith({
      target: "universal",
      url: "https://example.com",
    });
    expect(stdout).toBe('{"ok":true}\n');
  });

  it("prints full envelope with --full", async () => {
    const response = { results: [{ content: "x", status_code: 200 }] };
    const scrape = vi.fn().mockResolvedValue(response);
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createScrapeCommand(BundledSchema.shared));

    await program.parseAsync(
      ["scrape", "https://example.com", "--full", "--token", "test-token"],
      { from: "user" }
    );

    expect(stdout).toBe(`${JSON.stringify(response)}\n`);
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
      .addCommand(createScrapeCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(
        ["scrape", "https://example.com", "--token", "test-token"],
        { from: "user" }
      )
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });

  it("maps --country to geo and parses headers JSON", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: "ok" }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createScrapeCommand(BundledSchema.shared));

    await program.parseAsync(
      [
        "scrape",
        "https://example.com",
        "--country",
        "us",
        "--headers",
        '{"X-Test":"1"}',
        "--token",
        "test-token",
      ],
      { from: "user" }
    );

    expect(scrape).toHaveBeenCalledWith({
      target: "universal",
      url: "https://example.com",
      markdown: true,
      geo: "us",
      headers: { "X-Test": "1" },
    });
  });

  it("maps unknown target to usage exit code", async () => {
    const program = new Command()
      .option("--token <token>")
      .addCommand(createScrapeCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(
        [
          "scrape",
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
});
