import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockQuestion = vi.hoisted(() => vi.fn());

vi.mock("node:readline/promises", () => ({
  createInterface: vi.fn(() => ({
    question: mockQuestion,
    close: vi.fn(),
  })),
}));

async function runSetup(
  setupArgs: string[] = [],
  globalArgs: string[] = []
): Promise<void> {
  const { setupCommand } = await import("../../../src/auth/commands/setup.js");
  const program = new Command()
    .option("--token <token>", "global token")
    .addCommand(setupCommand);
  await program.parseAsync([...globalArgs, "setup", ...setupArgs], {
    from: "user",
  });
}

describe("setupCommand", () => {
  let configHome: string;
  let previousConfigHome: string | undefined;
  let exitCode: number | undefined;
  let stdout: string[];
  let stderr: string[];

  beforeEach(async () => {
    previousConfigHome = process.env.XDG_CONFIG_HOME;
    configHome = await mkdtemp(join(tmpdir(), "decodo-config-"));
    process.env.XDG_CONFIG_HOME = configHome;
    vi.resetModules();
    exitCode = undefined;
    stdout = [];
    stderr = [];
    mockQuestion.mockReset();

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
    if (previousConfigHome === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = previousConfigHome;
    }
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
    mockQuestion.mockResolvedValue("");

    await expect(runSetup([])).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
    expect(stderr.join("\n")).toContain("auth token is required");
  });

  it("exits with usage when interactive prompt returns whitespace", async () => {
    mockQuestion.mockResolvedValue("   ");

    await expect(runSetup([])).rejects.toThrow("process.exit:2");

    expect(exitCode).toBe(2);
    expect(stderr.join("\n")).toContain("auth token is required");
  });

  it("falls back to prompt when global --token is whitespace-only", async () => {
    mockQuestion.mockResolvedValue("");

    await expect(runSetup([], ["--token", "   "])).rejects.toThrow(
      "process.exit:2"
    );

    expect(mockQuestion).toHaveBeenCalledOnce();
    expect(exitCode).toBe(2);
  });

  it("does not save config on non-auth API error", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        message: "Rate limit exceeded",
        status: "failed",
      }),
    } as Response);

    await expect(runSetup(["--token", "valid-token"])).rejects.toThrow(
      "process.exit:1"
    );

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toBeUndefined();
    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("Rate limit exceeded");
  });

  it("prompts for token interactively when no flags are provided", async () => {
    mockQuestion.mockResolvedValue("prompted-token");

    await runSetup([]);

    expect(mockQuestion).toHaveBeenCalledOnce();
    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "prompted-token",
    });
    expect(stdout.join("\n")).toContain("Setup complete");
  });
});
