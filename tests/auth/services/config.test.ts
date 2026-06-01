import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

describe("auth config", () => {
  let restoreConfigHome: () => void;
  let configPath: string;

  beforeEach(async () => {
    ({ configPath, restore: restoreConfigHome } = await isolateConfigHome());
    vi.resetModules();
  });

  afterEach(() => {
    restoreConfigHome();
    vi.resetModules();
  });

  it("writes and reads config.json under decodo/", async () => {
    const { writeConfig, readConfig, getConfigPath } = await import(
      "../../../src/auth/services/config.js"
    );

    await writeConfig({
      authToken: "test-token-value",
    });
    expect(getConfigPath()).toBe(configPath);

    const saved = await readConfig();
    expect(saved).toEqual({
      authToken: "test-token-value",
    });

    const raw = await readFile(getConfigPath(), "utf8");
    expect(JSON.parse(raw)).toEqual({
      authToken: "test-token-value",
    });
  });

  it("clears config file on reset", async () => {
    const { writeConfig, clearConfig, readConfig } = await import(
      "../../../src/auth/services/config.js"
    );

    await writeConfig({ authToken: "test-token-value" });
    await clearConfig();
    expect(await readConfig()).toBeUndefined();
  });
});
