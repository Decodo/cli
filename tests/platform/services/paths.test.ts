import { homedir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getConfigDir", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns ~/.config/decodo when no override is set", async () => {
    vi.stubEnv("DECODO_CONFIG_HOME", undefined);

    const { getConfigDir } = await import(
      "../../../src/platform/services/paths.js"
    );

    expect(getConfigDir()).toBe(join(homedir(), ".config", "decodo"));
  });

  it("returns DECODO_CONFIG_HOME when set", async () => {
    vi.stubEnv("DECODO_CONFIG_HOME", "/custom/config");

    const { getConfigDir } = await import(
      "../../../src/platform/services/paths.js"
    );

    expect(getConfigDir()).toBe("/custom/config");
  });
});

describe("getLegacyConfigDir", () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    vi.resetModules();
  });

  it("returns macOS Library/Preferences path on darwin", async () => {
    Object.defineProperty(process, "platform", { value: "darwin" });

    const { getLegacyConfigDir } = await import(
      "../../../src/platform/services/paths.js"
    );

    expect(getLegacyConfigDir()).toBe(
      join(homedir(), "Library", "Preferences", "decodo")
    );
  });

  it("returns undefined on non-darwin platforms", async () => {
    Object.defineProperty(process, "platform", { value: "linux" });

    const { getLegacyConfigDir } = await import(
      "../../../src/platform/services/paths.js"
    );

    expect(getLegacyConfigDir()).toBeUndefined();
  });
});
