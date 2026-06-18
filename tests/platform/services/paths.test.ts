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
    vi.stubEnv("XDG_CONFIG_HOME", undefined);

    const { getConfigDir } = await import(
      "../../../src/platform/services/paths.js"
    );

    expect(getConfigDir()).toBe(join(homedir(), ".config", "decodo"));
  });

  it("honors XDG_CONFIG_HOME when set and no override", async () => {
    vi.stubEnv("DECODO_CONFIG_HOME", undefined);
    vi.stubEnv("XDG_CONFIG_HOME", "/xdg-config");

    const { getConfigDir } = await import(
      "../../../src/platform/services/paths.js"
    );

    expect(getConfigDir()).toBe(join("/xdg-config", "decodo"));
  });

  it("returns DECODO_CONFIG_HOME when set (precedence over XDG)", async () => {
    vi.stubEnv("DECODO_CONFIG_HOME", "/custom/config");
    vi.stubEnv("XDG_CONFIG_HOME", "/xdg-config");

    const { getConfigDir } = await import(
      "../../../src/platform/services/paths.js"
    );

    expect(getConfigDir()).toBe("/custom/config");
  });
});
