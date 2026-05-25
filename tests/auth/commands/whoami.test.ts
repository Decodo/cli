import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("whoamiCommand", () => {
  let configHome: string;
  let previousConfigHome: string | undefined;
  let previousEnvToken: string | undefined;
  let exitCode: number | undefined;
  let stdout: string[];

  beforeEach(async () => {
    previousConfigHome = process.env.XDG_CONFIG_HOME;
    previousEnvToken = process.env.DECODO_AUTH_TOKEN;
    configHome = await mkdtemp(join(tmpdir(), "decodo-config-"));
    process.env.XDG_CONFIG_HOME = configHome;
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
    if (previousConfigHome === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = previousConfigHome;
    }
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
    await writeConfig({ authToken: "abcdefghijklmnop" });

    const { whoamiCommand } = await import(
      "../../../src/auth/commands/whoami.js"
    );
    const program = new Command().addCommand(whoamiCommand);
    await program.parseAsync(["whoami"], { from: "user" });

    expect(stdout).toContain("source: config");
    expect(stdout).toContain("token: abcd...mnop");
  });

  it("exits with code 3 when no token is available", async () => {
    const { whoamiCommand } = await import(
      "../../../src/auth/commands/whoami.js"
    );
    const program = new Command().addCommand(whoamiCommand);
    await expect(
      program.parseAsync(["whoami"], { from: "user" })
    ).rejects.toThrow("process.exit:3");
    expect(exitCode).toBe(3);
  });
});
