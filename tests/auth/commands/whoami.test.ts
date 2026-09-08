import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

async function runWhoami(args: string[]): Promise<void> {
  const { whoamiCommand } = await import(
    "../../../src/auth/commands/whoami.js"
  );
  const program = new Command()
    .option("--token <token>", "global token")
    .option("--api-key <key>", "global api key")
    .addCommand(whoamiCommand);
  await program.parseAsync(args, { from: "user" });
}

describe("whoamiCommand", () => {
  let restoreConfigHome: () => void;
  let previousEnvToken: string | undefined;
  let previousEnvApiKey: string | undefined;
  let exitCode: number | undefined;
  let stdout: string[];

  beforeEach(async () => {
    ({ restore: restoreConfigHome } = await isolateConfigHome());
    previousEnvToken = process.env.DECODO_AUTH_TOKEN;
    previousEnvApiKey = process.env.DECODO_API_KEY;
    delete process.env.DECODO_AUTH_TOKEN;
    delete process.env.DECODO_API_KEY;
    vi.resetModules();
    exitCode = undefined;
    stdout = [];

    vi.spyOn(process, "exit").mockImplementation((code) => {
      exitCode = code as number;
      throw new Error(`process.exit:${code}`);
    });
    vi.spyOn(console, "log").mockImplementation((msg) => {
      stdout.push(String(msg));
    });
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreConfigHome();
    if (previousEnvToken === undefined) {
      delete process.env.DECODO_AUTH_TOKEN;
    } else {
      process.env.DECODO_AUTH_TOKEN = previousEnvToken;
    }
    if (previousEnvApiKey === undefined) {
      delete process.env.DECODO_API_KEY;
    } else {
      process.env.DECODO_API_KEY = previousEnvApiKey;
    }
    vi.resetModules();
  });

  it("prints auth source and masked token from config", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "abcdefghijklmnop" });

    await runWhoami(["whoami"]);

    expect(stdout).toContain("source: config");
    expect(stdout).toContain("token: abcd...mnop");
  });

  it("prints auth source and masked token from global --token", async () => {
    await runWhoami(["--token", "abcdefghijklmnop", "whoami"]);

    expect(stdout).toContain("source: flag");
    expect(stdout).toContain("token: abcd...mnop");
  });

  it("prefers global --token over saved config", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "config-token-value" });

    await runWhoami(["--token", "flag-token-value", "whoami"]);

    expect(stdout).toContain("source: flag");
    expect(stdout).toContain("token: flag...alue");
  });

  it("prints the api key label for a saved api key", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ apiKey: "abcdefghijklmnop" });

    await runWhoami(["whoami"]);

    expect(stdout).toContain("source: config");
    expect(stdout).toContain("api key: abcd...mnop");
  });

  it("prints the api key from global --api-key", async () => {
    await runWhoami(["--api-key", "abcdefghijklmnop", "whoami"]);

    expect(stdout).toContain("source: flag");
    expect(stdout).toContain("api key: abcd...mnop");
  });

  it("exits with code 3 when no credential is available", async () => {
    await expect(runWhoami(["whoami"])).rejects.toThrow("process.exit:3");
    expect(exitCode).toBe(3);
  });
});
