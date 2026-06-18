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

  it("throws ConfigParseError for malformed config.json", async () => {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const { dirname } = await import("node:path");
    const { getConfigPath, readConfig } = await import(
      "../../../src/auth/services/config.js"
    );

    const path = getConfigPath();
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, "{ not json", "utf8");

    await expect(readConfig()).rejects.toMatchObject({
      name: "ConfigParseError",
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

  it("migrates config from legacy macOS path when new path is missing", async () => {
    const { mkdir, mkdtemp, readFile, rm, writeFile } = await import(
      "node:fs/promises"
    );
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const originalPlatform = process.platform;
    const originalHome = process.env.HOME;
    const originalConfigHome = process.env.DECODO_CONFIG_HOME;

    const fakeHome = await mkdtemp(join(tmpdir(), "decodo-home-"));
    process.env.HOME = fakeHome;
    delete process.env.DECODO_CONFIG_HOME;
    Object.defineProperty(process, "platform", { value: "darwin" });
    vi.resetModules();

    const configDir = join(fakeHome, ".config", "decodo");
    const legacyDir = join(fakeHome, "Library", "Preferences", "decodo");
    const legacyPath = join(legacyDir, "config.json");

    await mkdir(legacyDir, { recursive: true });
    await writeFile(
      legacyPath,
      `${JSON.stringify({ authToken: "legacy-token" }, null, 2)}\n`,
      "utf8"
    );

    try {
      const { readConfig } = await import(
        "../../../src/auth/services/config.js"
      );

      expect(await readConfig()).toEqual({
        authToken: "legacy-token",
      });
      expect(await readFile(join(configDir, "config.json"), "utf8")).toContain(
        "legacy-token"
      );
    } finally {
      Object.defineProperty(process, "platform", { value: originalPlatform });
      if (originalHome === undefined) {
        delete process.env.HOME;
      } else {
        process.env.HOME = originalHome;
      }
      if (originalConfigHome === undefined) {
        delete process.env.DECODO_CONFIG_HOME;
      } else {
        process.env.DECODO_CONFIG_HOME = originalConfigHome;
      }
      await rm(fakeHome, { recursive: true, force: true });
      vi.resetModules();
    }
  });
});
