import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_TYPE } from "../../../src/auth/constants.js";
import { resolveAuthToken } from "../../../src/auth/services/resolve-token.js";
import { createDataAction } from "../../../src/cli/services/run-data-action.js";
import { createDecodoClient } from "../../../src/scrape/services/client.js";

vi.mock("../../../src/auth/services/resolve-token.js", () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock("../../../src/scrape/services/client.js", () => ({
  createDecodoClient: vi.fn(),
}));

function run(handler: Parameters<typeof createDataAction>[0]) {
  const program = new Command()
    .option("--token <token>")
    .option("-v, --verbose")
    .addCommand(
      new Command("probe")
        .argument("<input>")
        .option("--flag")
        .action(createDataAction(handler))
    );

  return program.parseAsync(["probe", "value", "--flag", "--token", "key"], {
    from: "user",
  });
}

describe("createDataAction", () => {
  let exitCode: number | undefined;
  let stderr: string[];
  const api = { search: vi.fn() };

  beforeEach(() => {
    exitCode = undefined;
    stderr = [];
    vi.mocked(createDecodoClient).mockReturnValue({
      webScrapingApi: api,
    } as never);
    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, "error").mockImplementation((message) => {
      stderr.push(String(message));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes the client, input and options to the handler", async () => {
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: { type: AUTH_TYPE.API_KEY, value: "key" },
      source: "flag",
    });
    const handler = vi.fn().mockResolvedValue(undefined);

    await run(handler);

    expect(resolveAuthToken).toHaveBeenCalledWith({ token: "key" });
    expect(handler).toHaveBeenCalledWith({
      api,
      input: "value",
      options: { flag: true, token: "key" },
      verbose: false,
    });
  });

  it("exits 3 when no credential is configured", async () => {
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: undefined,
      source: "none",
    });

    await expect(run(vi.fn())).rejects.toThrow("process.exit:3");
    expect(exitCode).toBe(3);
  });

  it("exits 3 with an API key hint for a basic token", async () => {
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: { type: AUTH_TYPE.TOKEN, value: "dTpw" },
      source: "config",
    });
    const handler = vi.fn();

    await expect(run(handler)).rejects.toThrow("process.exit:3");
    expect(handler).not.toHaveBeenCalled();
    expect(stderr[0]).toContain("needs a Web Data API key");
  });

  it("routes handler errors through the CLI error handler", async () => {
    vi.mocked(resolveAuthToken).mockResolvedValue({
      credential: { type: AUTH_TYPE.API_KEY, value: "key" },
      source: "flag",
    });

    await expect(run(() => Promise.reject(new Error("boom")))).rejects.toThrow(
      "process.exit:1"
    );
    expect(stderr[0]).toBe("Error: boom");
  });
});
