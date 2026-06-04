import { BundledSchema, ValidationError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthToken } from "../../../src/auth/services/resolve-token.js";
import { createSearchCommand } from "../../../src/scrape/commands/search.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  requireAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

describe("createSearchCommand", () => {
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

  it("posts tier-1 search body and prints JSON response", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: { ok: true } }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createSearchCommand(BundledSchema.shared));

    await program.parseAsync(["search", "coffee", "--token", "test-token"], {
      from: "user",
    });

    expect(scrape).toHaveBeenCalledWith({
      target: "google_search",
      query: "coffee",
    });
    expect(stdout).toBe('{"ok":true}\n');
  });

  it("maps --engine bing to bing_search target", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: "ok" }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createSearchCommand(BundledSchema.shared));

    await program.parseAsync(
      ["search", "coffee", "--engine", "bing", "--token", "test-token"],
      { from: "user" }
    );

    expect(scrape).toHaveBeenCalledWith({
      target: "bing_search",
      query: "coffee",
    });
  });

  it("maps --geo and --limit to geo and page_count", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: "ok" }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createSearchCommand(BundledSchema.shared));

    await program.parseAsync(
      [
        "search",
        "coffee",
        "--geo",
        "us",
        "--limit",
        "3",
        "--token",
        "test-token",
      ],
      { from: "user" }
    );

    expect(scrape).toHaveBeenCalledWith({
      target: "google_search",
      query: "coffee",
      geo: "us",
      page_count: 3,
    });
  });

  it("resolves --target kebab-case override", async () => {
    const scrape = vi.fn().mockResolvedValue({
      results: [{ content: "ok" }],
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { scrape },
    } as never);

    const program = new Command()
      .option("--token <token>")
      .addCommand(createSearchCommand(BundledSchema.shared));

    await program.parseAsync(
      [
        "search",
        "coffee",
        "--engine",
        "bing",
        "--target",
        "google-search",
        "--token",
        "test-token",
      ],
      { from: "user" }
    );

    expect(scrape).toHaveBeenCalledWith({
      target: "google_search",
      query: "coffee",
    });
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
      .addCommand(createSearchCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(["search", "coffee", "--token", "test-token"], {
        from: "user",
      })
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });

  it("maps unknown target to usage exit code", async () => {
    const program = new Command()
      .option("--token <token>")
      .addCommand(createSearchCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(
        [
          "search",
          "coffee",
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

  it("maps out-of-range --limit to usage exit code", async () => {
    const program = new Command()
      .option("--token <token>")
      .addCommand(createSearchCommand(BundledSchema.shared));

    await expect(
      program.parseAsync(
        ["search", "coffee", "--limit", "11", "--token", "test-token"],
        { from: "user" }
      )
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });
});
