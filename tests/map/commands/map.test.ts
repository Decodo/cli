import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_TYPE } from "../../../src/auth/constants.js";
import { resolveAuthToken } from "../../../src/auth/services/resolve-token.js";
import { createMapCommand } from "../../../src/map/commands/map.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";
import { runDataCommand } from "../../cli/helpers/run-data-command.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

const RESPONSE = {
  results: [
    {
      content: {
        links: [
          { url: "https://example.com/" },
          { url: "https://example.com/a" },
        ],
      },
    },
  ],
};

describe("createMapCommand", () => {
  let stdout: string | undefined;
  const map = vi.fn();

  beforeEach(() => {
    stdout = undefined;
    map.mockReset().mockResolvedValue(RESPONSE);
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: { type: AUTH_TYPE.API_KEY, value: "key" },
      source: "flag",
    });
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: { map },
    } as never);
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      stdout = String(chunk);
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints one URL per line", async () => {
    await runDataCommand(createMapCommand(), ["map", "https://example.com"]);

    expect(map).toHaveBeenCalledWith({ url: "https://example.com" });
    expect(stdout).toBe("https://example.com/\nhttps://example.com/a\n");
  });

  it("maps flags to the request", async () => {
    await runDataCommand(createMapCommand(), [
      "map",
      "https://example.com",
      "--limit",
      "50",
      "--sitemap",
      "only",
      "--domain-filter",
      "all",
      "--select-paths",
      "/blog/*",
      "--select-paths",
      "/docs/*",
      "--js-rendering",
    ]);

    expect(map).toHaveBeenCalledWith({
      url: "https://example.com",
      limit: 50,
      sitemap: "only",
      domain_filter: "all",
      select_paths: ["/blog/*", "/docs/*"],
      JS_rendering: true,
    });
  });

  it("prints the full response with --full", async () => {
    await runDataCommand(createMapCommand(), [
      "map",
      "https://example.com",
      "--full",
    ]);

    expect(stdout).toBe(`${JSON.stringify(RESPONSE)}\n`);
  });
});
