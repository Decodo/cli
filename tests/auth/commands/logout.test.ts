import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("logoutCommand", () => {
  let configHome: string;
  let previousConfigHome: string | undefined;
  let stdout: string[];

  beforeEach(async () => {
    previousConfigHome = process.env.XDG_CONFIG_HOME;
    configHome = await mkdtemp(join(tmpdir(), "decodo-config-"));
    process.env.XDG_CONFIG_HOME = configHome;
    vi.resetModules();
    stdout = [];
    vi.spyOn(console, "log").mockImplementation((msg) => {
      stdout.push(String(msg));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (previousConfigHome === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = previousConfigHome;
    }
    vi.resetModules();
  });

  it("clears saved config", async () => {
    const { writeConfig, readConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "saved-token" });

    const { logoutCommand } = await import(
      "../../../src/auth/commands/logout.js"
    );
    const program = new Command().addCommand(logoutCommand);
    await program.parseAsync(["logout"], { from: "user" });

    expect(await readConfig()).toBeUndefined();
    expect(stdout.join("\n")).toContain("Configuration cleared");
  });
});
