import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("resolveAuthToken", () => {
  let configHome: string;
  let previousConfigHome: string | undefined;
  let previousEnvToken: string | undefined;

  beforeEach(async () => {
    previousConfigHome = process.env.XDG_CONFIG_HOME;
    previousEnvToken = process.env.DECODO_AUTH_TOKEN;
    configHome = await mkdtemp(join(tmpdir(), "decodo-config-"));
    process.env.XDG_CONFIG_HOME = configHome;
    delete process.env.DECODO_AUTH_TOKEN;
    vi.resetModules();
  });

  afterEach(() => {
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

  it("prefers flag over env and config", async () => {
    process.env.DECODO_AUTH_TOKEN = "env-token";
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "config-token" });

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken({ token: "flag-token" });
    expect(result).toEqual({ token: "flag-token", source: "flag" });
  });

  it("prefers env over config", async () => {
    process.env.DECODO_AUTH_TOKEN = "env-token";
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "config-token" });

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({ token: "env-token", source: "env" });
  });

  it("reads token from config file", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "config-token" });

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({ token: "config-token", source: "config" });
  });

  it("returns none when no token is available", async () => {
    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({ token: undefined, source: "none" });
  });
});

describe("requireAuthToken", () => {
  let configHome: string;
  let previousConfigHome: string | undefined;
  let previousEnvToken: string | undefined;

  beforeEach(async () => {
    previousConfigHome = process.env.XDG_CONFIG_HOME;
    previousEnvToken = process.env.DECODO_AUTH_TOKEN;
    configHome = await mkdtemp(join(tmpdir(), "decodo-config-"));
    process.env.XDG_CONFIG_HOME = configHome;
    delete process.env.DECODO_AUTH_TOKEN;
    vi.resetModules();
  });

  afterEach(() => {
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

  it("throws AuthRequiredError when no token is available", async () => {
    const { requireAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const { AuthRequiredError } = await import(
      "../../../src/auth/errors/auth-required-error.js"
    );
    await expect(requireAuthToken()).rejects.toBeInstanceOf(AuthRequiredError);
    await expect(requireAuthToken()).rejects.toThrow("decodo setup");
  });
});
