import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

const mockPromptHidden = vi.hoisted(() => vi.fn());

vi.mock("../../../src/platform/services/prompt-hidden.js", () => ({
  promptHidden: mockPromptHidden,
}));

async function runSetup(
  setupArgs: string[] = [],
  globalArgs: string[] = []
): Promise<void> {
  const { setupCommand } = await import("../../../src/auth/commands/setup.js");
  const program = new Command()
    .option("--token <token>", "global token")
    .option("--api-key <key>", "global api key")
    .addCommand(setupCommand);
  await program.parseAsync([...globalArgs, "setup", ...setupArgs], {
    from: "user",
  });
}

describe("setupCommand", () => {
  let restoreConfigHome: () => void;
  let exitCode: number | undefined;
  let stdout: string[];
  let stderr: string[];

  beforeEach(async () => {
    ({ restore: restoreConfigHome } = await isolateConfigHome());
    vi.resetModules();
    exitCode = undefined;
    stdout = [];
    stderr = [];
    mockPromptHidden.mockReset();

    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, "log").mockImplementation((msg) => {
      stdout.push(String(msg));
    });
    vi.spyOn(console, "error").mockImplementation((msg) => {
      stderr.push(String(msg));
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ results: [] }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreConfigHome();
    vi.resetModules();
  });

  it("saves config on successful validation", async () => {
    await runSetup(["--token", "valid-token"]);

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "valid-token",
    });
    expect(stdout.join("\n")).toContain("Setup complete");
  });

  it("saves an api key when --api-key is provided", async () => {
    await runSetup(["--api-key", "valid-key"]);

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      apiKey: "valid-key",
    });
    expect(stdout.join("\n")).toContain("Setup complete");
  });

  it("saves an api key from global --api-key", async () => {
    await runSetup([], ["--api-key", "global-key"]);

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      apiKey: "global-key",
    });
  });

  it("rejects --api-key and --token together", async () => {
    await expect(
      runSetup(["--api-key", "setup-key", "--token", "setup-token"])
    ).rejects.toThrow("process.exit:2");

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toBeUndefined();
    expect(stderr.join("\n")).toContain(
      "Provide either --token or --api-key, not both."
    );
  });

  it("validates an api key against the data api endpoint", async () => {
    await runSetup(["--api-key", "valid-key"]);

    expect(fetch).toHaveBeenCalledWith(
      "https://data.decodo.com/v1/scrape",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer valid-key",
        }),
      })
    );
  });

  it("validates a token against the scraper api endpoint", async () => {
    await runSetup(["--token", "valid-token"]);

    expect(fetch).toHaveBeenCalledWith(
      "https://scraper-api.decodo.com/v2/scrape",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Basic valid-token",
        }),
      })
    );
  });

  it("rejects a global --api-key mixed with a subcommand --token", async () => {
    await expect(
      runSetup(["--token", "setup-token"], ["--api-key", "global-key"])
    ).rejects.toThrow("process.exit:2");

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toBeUndefined();
  });

  it("rejects a global --token mixed with a subcommand --api-key", async () => {
    await expect(
      runSetup(["--api-key", "setup-key"], ["--token", "global-token"])
    ).rejects.toThrow("process.exit:2");

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toBeUndefined();
  });

  it("trims surrounding whitespace from a saved api key", async () => {
    await runSetup(["--api-key", "  spaced-key  "]);

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      apiKey: "spaced-key",
    });
  });

  it("does not save config on 401", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized", status: "failed" }),
    } as Response);

    await expect(runSetup(["--token", "bad-token"])).rejects.toThrow(
      "process.exit:3"
    );

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toBeUndefined();
    expect(exitCode).toBe(3);
  });

  it("saves config when token comes from global --token", async () => {
    await runSetup([], ["--token", "global-token"]);

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "global-token",
    });
    expect(stdout.join("\n")).toContain("Setup complete");
  });

  it("prefers setup --token over global --token", async () => {
    await runSetup(["--token", "setup-token"], ["--token", "global-token"]);

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "setup-token",
    });
  });

  it("exits with usage when interactive prompt returns empty input", async () => {
    mockPromptHidden.mockResolvedValue("");

    await expect(runSetup([])).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
    expect(stderr.join("\n")).toContain("auth token is required");
  });

  it("exits with usage when interactive prompt returns whitespace", async () => {
    mockPromptHidden.mockResolvedValue("   ");

    await expect(runSetup([])).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
    expect(stderr.join("\n")).toContain("auth token is required");
  });

  it("falls back to prompt when global --token is whitespace-only", async () => {
    mockPromptHidden.mockResolvedValue("");

    await expect(runSetup([], ["--token", "   "])).rejects.toThrow(
      "process.exit:2"
    );

    expect(mockPromptHidden).toHaveBeenCalledOnce();
    expect(exitCode).toBe(2);
  });

  it("maps 429 API errors to the rate-limit exit code", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        message: "Rate limit exceeded",
        status: "failed",
      }),
    } as Response);

    await expect(runSetup(["--token", "valid-token"])).rejects.toThrow(
      "process.exit:5"
    );

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toBeUndefined();
    expect(exitCode).toBe(5);
    expect(stderr.join("\n")).toContain("Rate limit exceeded");
  });

  it("prompts for token interactively when no flags are provided", async () => {
    mockPromptHidden.mockResolvedValue("prompted-token");

    await runSetup([]);

    expect(mockPromptHidden).toHaveBeenCalledOnce();
    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "prompted-token",
    });
    expect(stdout.join("\n")).toContain("Setup complete");
  });
});
