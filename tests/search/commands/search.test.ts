import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_TYPE } from "../../../src/auth/constants.js";
import { resolveAuthToken } from "../../../src/auth/services/resolve-token.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";
import { createSearchCommand } from "../../../src/search/commands/search.js";
import { runDataCommand } from "../../cli/helpers/run-data-command.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

describe("createSearchCommand", () => {
  let exitCode: number | undefined;
  let stdout: string | undefined;
  let stderr: string[];
  const search = vi.fn();

  beforeEach(() => {
    exitCode = undefined;
    stdout = undefined;
    stderr = [];
    search.mockReset();
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: { type: AUTH_TYPE.API_KEY, value: "key" },
      source: "flag",
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { search },
    } as never);
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout = String(chunk);
      return true;
    });
    vi.spyOn(console, "error").mockImplementation((message) => {
      stderr.push(String(message));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the data API search and prints the response", async () => {
    search.mockResolvedValue({ status: "done", organic: [] });

    await runDataCommand(createSearchCommand(), [
      "search",
      "coffee",
      "--geo",
      "de",
      "--locale",
      "de-DE",
      "--page",
      "2",
    ]);

    expect(search).toHaveBeenCalledWith({
      query: "coffee",
      geo: "de",
      locale: "de-DE",
      page: 2,
    });
    expect(stdout).toBe('{"status":"done","organic":[]}\n');
  });

  it("sends only the query by default", async () => {
    search.mockResolvedValue({ status: "done" });

    await runDataCommand(createSearchCommand(), ["search", "coffee"]);

    expect(search).toHaveBeenCalledWith({ query: "coffee" });
  });

  it("exits 7 when the search fails", async () => {
    search.mockResolvedValue({
      status: "failed",
      status_code: 502,
      message: "upstream failed",
    });

    await expect(
      runDataCommand(createSearchCommand(), ["search", "coffee"])
    ).rejects.toThrow("process.exit:7");
    expect(exitCode).toBe(7);
    expect(stderr[0]).toBe("Error: upstream failed");
  });
});
