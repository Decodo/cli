import { BundledSchema, ValidationError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAuthToken } from "../../../src/auth/services/resolve-token.js";
import { attachScrapeOutputOptions } from "../../../src/output/commands/attach-output-options.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";
import { createTargetAction } from "../../../src/scrape/services/run-target-scrape.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

const RESPONSE_LATENCY_LOG_PATTERN = /\[verbose\] response latency_ms=\d+\n/;

describe("createTargetAction", () => {
  let exitCode: number | undefined;
  let stdout: string | undefined;
  let stderr: string | undefined;

  beforeEach(() => {
    exitCode = undefined;
    stdout = undefined;
    stderr = undefined;

    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });

    vi.mocked(resolveAuthToken).mockResolvedValue({
      token: "test-token",
      source: "flag",
    });
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout = String(chunk);
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
      stderr = (stderr ?? "") + String(chunk);
      return true;
    });
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts scrape body and prints content as JSON", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: { ok: true } }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const googleSearch = new Command("google-search")
      .argument("<input>")
      .action(createTargetAction("google_search", BundledSchema.shared));
    attachScrapeOutputOptions(googleSearch);

    const program = new Command()
      .option("--token <token>")
      .addCommand(googleSearch);

    await program.parseAsync(
      ["google-search", "coffee", "--token", "test-token"],
      { from: "user" }
    );

    expect(scrape).toHaveBeenCalledWith({
      target: "google_search",
      query: "coffee",
      parse: true,
      markdown: false,
    });
    expect(createDecodoClient).toHaveBeenCalledWith(
      "test-token",
      BundledSchema.shared
    );
    expect(stdout).toBe('{"ok":true}\n');
  });

  it("prints verbose logs to stderr when --verbose is set", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: { ok: true } }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .option("-v, --verbose")
      .addCommand(
        new Command("google-search")
          .argument("<input>")
          .action(createTargetAction("google_search", BundledSchema.shared))
      );

    await program.parseAsync(
      ["google-search", "coffee", "--token", "test-token", "--verbose"],
      { from: "user" }
    );

    expect(stderr).toContain("[verbose] auth source=flag\n");
    expect(stderr).toContain(
      "[verbose] request target=google_search query=coffee\n"
    );
    expect(stderr).toMatch(RESPONSE_LATENCY_LOG_PATTERN);
    expect(stderr).not.toContain("test-token");
  });

  it("keeps stderr silent when --verbose is not set", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: { ok: true } }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(
        new Command("google-search")
          .argument("<input>")
          .action(createTargetAction("google_search", BundledSchema.shared))
      );

    await program.parseAsync(
      ["google-search", "coffee", "--token", "test-token"],
      { from: "user" }
    );

    expect(stderr).toBeUndefined();
  });

  it("maps resolveAuthToken failures through handleCliError", async () => {
    vi.mocked(resolveAuthToken).mockRejectedValue(
      new SyntaxError("Unexpected token in config.json")
    );

    const program = new Command()
      .option("--token <token>")
      .addCommand(
        new Command("google-search")
          .argument("<input>")
          .action(createTargetAction("google_search", BundledSchema.shared))
      );

    await expect(
      program.parseAsync(["google-search", "coffee"], { from: "user" })
    ).rejects.toThrow("process.exit:1");

    expect(exitCode).toBe(1);
    expect(createDecodoClient).not.toHaveBeenCalled();
  });

  it("maps validation errors to validation exit code", async () => {
    const scrape = vi
      .fn()
      .mockRejectedValue(new ValidationError("invalid params"));
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(
        new Command("google-search")
          .argument("<input>")
          .action(createTargetAction("google_search", BundledSchema.shared))
      );

    await expect(
      program.parseAsync(["google-search", "coffee", "--token", "test-token"], {
        from: "user",
      })
    ).rejects.toThrow("process.exit:4");

    expect(exitCode).toBe(4);
  });
});
