import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

describe("resetCommand", () => {
  let restoreConfigHome: () => void;
  let stdout: string[];

  beforeEach(async () => {
    ({ restore: restoreConfigHome } = await isolateConfigHome());
    vi.resetModules();
    stdout = [];
    vi.spyOn(console, "log").mockImplementation((msg) => {
      stdout.push(String(msg));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreConfigHome();
    vi.resetModules();
  });

  it("clears saved config", async () => {
    const { writeConfig, readConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "saved-token" });

    const { resetCommand } = await import(
      "../../../src/auth/commands/reset.js"
    );
    const program = new Command().addCommand(resetCommand);
    await program.parseAsync(["reset"], { from: "user" });

    expect(await readConfig()).toBeUndefined();
    expect(stdout.join("\n")).toContain("Configuration cleared");
  });
});
