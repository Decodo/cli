import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

const mockPromptHidden = vi.hoisted(() => vi.fn());

const API_KEY_SHAPED =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

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
    await runSetup(["--token", "VTAwMDAwMDAwMDE6UFdfdmFsaWRzZWNyZXQ="]);

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "VTAwMDAwMDAwMDE6UFdfdmFsaWRzZWNyZXQ=",
    });
    expect(stdout.join("\n")).toContain("Setup complete");
  });

  it("validates a token against the scraper api endpoint", async () => {
    await runSetup(["--token", "VTAwMDAwMDAwMDE6UFdfdmFsaWRzZWNyZXQ="]);

    expect(fetch).toHaveBeenCalledWith(
      "https://scraper-api.decodo.com/v2/scrape",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Basic VTAwMDAwMDAwMDE6UFdfdmFsaWRzZWNyZXQ=",
        }),
      })
    );
  });

  it("falls back to the opposite auth type when the detected one is rejected", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid credentials", status: "failed" }),
    } as Response);

    await runSetup(["--token", API_KEY_SHAPED]);

    expect(fetch).toHaveBeenCalledTimes(2);
    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({ authToken: API_KEY_SHAPED });
  });

  it("reports the detected type's error when both auth types fail", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "ORIGINAL-error", status: "failed" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "FALLBACK-error", status: "failed" }),
      } as Response);

    await expect(runSetup(["--token", API_KEY_SHAPED])).rejects.toThrow(
      "process.exit:3"
    );

    expect(stderr.join("\n")).toContain("ORIGINAL-error");
    expect(stderr.join("\n")).not.toContain("FALLBACK-error");
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
    await runSetup([], ["--token", "VTAwMDAwMDAwMDI6UFdfZ2xvYmFsc2VjcmV0"]);

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "VTAwMDAwMDAwMDI6UFdfZ2xvYmFsc2VjcmV0",
    });
    expect(stdout.join("\n")).toContain("Setup complete");
  });

  it("prefers setup --token over global --token", async () => {
    await runSetup(
      ["--token", "VTAwMDAwMDAwMDM6UFdfc2V0dXBzZWNyZXQ="],
      ["--token", "VTAwMDAwMDAwMDI6UFdfZ2xvYmFsc2VjcmV0"]
    );

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "VTAwMDAwMDAwMDM6UFdfc2V0dXBzZWNyZXQ=",
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

    await expect(
      runSetup(["--token", "VTAwMDAwMDAwMDE6UFdfdmFsaWRzZWNyZXQ="])
    ).rejects.toThrow("process.exit:5");

    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toBeUndefined();
    expect(exitCode).toBe(5);
    expect(stderr.join("\n")).toContain("Rate limit exceeded");
  });

  it("prompts for token interactively when no flags are provided", async () => {
    mockPromptHidden.mockResolvedValue(
      "VTAwMDAwMDAwMDQ6UFdfcHJvbXB0ZWRzZWNyZXQ="
    );

    await runSetup([]);

    expect(mockPromptHidden).toHaveBeenCalledOnce();
    const { readConfig } = await import("../../../src/auth/services/config.js");
    expect(await readConfig()).toEqual({
      authToken: "VTAwMDAwMDAwMDQ6UFdfcHJvbXB0ZWRzZWNyZXQ=",
    });
    expect(stdout.join("\n")).toContain("Setup complete");
  });
});
