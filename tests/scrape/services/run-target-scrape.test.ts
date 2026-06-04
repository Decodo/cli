import { BundledSchema, ValidationError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthToken } from "../../../src/auth/services/resolve-token.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";
import { createTargetAction } from "../../../src/scrape/services/run-target-scrape.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  requireAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

describe("createTargetAction", () => {
  let exitCode: number | undefined;
  let stdout: string[];

  beforeEach(() => {
    exitCode = undefined;
    stdout = [];

    vi.mocked(requireAuthToken).mockResolvedValue("test-token");
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, "log").mockImplementation((message) => {
      stdout.push(String(message));
    });
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts scrape body and prints JSON response", async () => {
    const scrape = vi.fn().mockResolvedValue({ results: [{ ok: true }] });
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

    expect(scrape).toHaveBeenCalledWith({
      target: "google_search",
      query: "coffee",
    });
    expect(stdout).toEqual([
      JSON.stringify({ results: [{ ok: true }] }, null, 2),
    ]);
  });

  it("maps requireAuthToken failures through handleScrapeError", async () => {
    vi.mocked(requireAuthToken).mockRejectedValue(
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

  it("maps validation errors to usage exit code", async () => {
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
    ).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
  });
});
