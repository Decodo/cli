import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

async function runWhoami(args: string[]): Promise<void> {
  const { whoamiCommand } = await import(
    "../../../src/auth/commands/whoami.js"
  );
  const program = new Command()
    .option("--token <token>", "global token")
    .addCommand(whoamiCommand);
  await program.parseAsync(args, { from: "user" });
}

describe("whoamiCommand", () => {
  let restoreConfigHome: () => void;
  let previousEnvToken: string | undefined;
  let exitCode: number | undefined;
  let stdout: string[];

  beforeEach(async () => {
    ({ restore: restoreConfigHome } = await isolateConfigHome());
    previousEnvToken = process.env.DECODO_AUTH_TOKEN;
    delete process.env.DECODO_AUTH_TOKEN;
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
    vi.resetModules();
  });

  it("prints auth source and masked token from config", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "VTAwMDAwMDAwMDU6UFdfd2hvYW1pc2VjcmV0" });

    await runWhoami(["whoami"]);

    expect(stdout).toContain("source: config");
    expect(stdout).toContain("token: VTAw...cmV0");
  });

  it("prints auth source and masked token from global --token", async () => {
    await runWhoami([
      "--token",
      "VTAwMDAwMDAwMDU6UFdfd2hvYW1pc2VjcmV0",
      "whoami",
    ]);

    expect(stdout).toContain("source: flag");
    expect(stdout).toContain("token: VTAw...cmV0");
  });

  it("prefers global --token over saved config", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "VTAwMDAwMDAwMDY6UFdfY29uZmlnc2VjcmV0" });

    await runWhoami([
      "--token",
      "VTAwMDAwMDAwMDI6UFdfZ2xvYmFsc2VjcmV0",
      "whoami",
    ]);

    expect(stdout).toContain("source: flag");
    expect(stdout).toContain("token: VTAw...cmV0");
  });

  it("prints the api key label for a saved api key", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({
      apiKey:
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    });

    await runWhoami(["whoami"]);

    expect(stdout).toContain("source: config");
    expect(stdout).toContain("api key: 0123...cdef");
  });

  it("exits with code 3 when no credential is available", async () => {
    await expect(runWhoami(["whoami"])).rejects.toThrow("process.exit:3");
    expect(exitCode).toBe(3);
  });
});
