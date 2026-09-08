import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

const ENV_KEYS = ["DECODO_AUTH_TOKEN", "DECODO_API_KEY"] as const;

describe("resolveAuthToken", () => {
  let restoreConfigHome: () => void;
  let previousEnv: Record<string, string | undefined>;

  beforeEach(async () => {
    ({ restore: restoreConfigHome } = await isolateConfigHome());
    previousEnv = {};
    for (const key of ENV_KEYS) {
      previousEnv[key] = process.env[key];
      delete process.env[key];
    }
    vi.resetModules();
  });

  afterEach(() => {
    restoreConfigHome();
    for (const key of ENV_KEYS) {
      const value = previousEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
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
    expect(result).toEqual({
      credential: { kind: "token", value: "flag-token" },
      source: "flag",
    });
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
    expect(result).toEqual({
      credential: { kind: "token", value: "env-token" },
      source: "env",
    });
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
    expect(result).toEqual({
      credential: { kind: "token", value: "config-token" },
      source: "config",
    });
  });

  it("returns none when no credential is available", async () => {
    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({ credential: undefined, source: "none" });
  });

  it("rejects both credential flags supplied together", async () => {
    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const { CliUsageError } = await import(
      "../../../src/platform/errors/cli-usage-error.js"
    );

    await expect(
      resolveAuthToken({ apiKey: "flag-key", token: "flag-token" })
    ).rejects.toThrow(CliUsageError);
  });

  it("allows both env vars to be set without erroring", async () => {
    process.env.DECODO_API_KEY = "env-key";
    process.env.DECODO_AUTH_TOKEN = "env-token";

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({
      credential: { kind: "token", value: "env-token" },
      source: "env",
    });
  });

  it("treats a whitespace-only flag as no credential", async () => {
    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken({ apiKey: "   ", token: "  " });
    expect(result).toEqual({ credential: undefined, source: "none" });
  });

  it("falls through a whitespace-only flag to the env var", async () => {
    process.env.DECODO_AUTH_TOKEN = "env-token";

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken({ apiKey: "   " });
    expect(result).toEqual({
      credential: { kind: "token", value: "env-token" },
      source: "env",
    });
  });

  it("trims surrounding whitespace from a resolved credential", async () => {
    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken({ apiKey: "  padded-key\n" });
    expect(result).toEqual({
      credential: { kind: "apiKey", value: "padded-key" },
      source: "flag",
    });
  });

  it("resolves an api key from the flag", async () => {
    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken({ apiKey: "flag-key" });
    expect(result).toEqual({
      credential: { kind: "apiKey", value: "flag-key" },
      source: "flag",
    });
  });

  it("prefers DECODO_AUTH_TOKEN over DECODO_API_KEY", async () => {
    process.env.DECODO_API_KEY = "env-key";
    process.env.DECODO_AUTH_TOKEN = "env-token";

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({
      credential: { kind: "token", value: "env-token" },
      source: "env",
    });
  });

  it("prefers the api key flag over DECODO_AUTH_TOKEN", async () => {
    process.env.DECODO_AUTH_TOKEN = "env-token";

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken({ apiKey: "flag-key" });
    expect(result).toEqual({
      credential: { kind: "apiKey", value: "flag-key" },
      source: "flag",
    });
  });

  it("prefers the token flag over DECODO_API_KEY", async () => {
    process.env.DECODO_API_KEY = "env-key";

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken({ token: "flag-token" });
    expect(result).toEqual({
      credential: { kind: "token", value: "flag-token" },
      source: "flag",
    });
  });

  it("reads an api key from the config file", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ apiKey: "config-key" });

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({
      credential: { kind: "apiKey", value: "config-key" },
      source: "config",
    });
  });

  it("prefers the config token over the config api key", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ apiKey: "config-key", authToken: "config-token" });

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({
      credential: { kind: "token", value: "config-token" },
      source: "config",
    });
  });

  it("still prefers an env api key over a saved config token", async () => {
    process.env.DECODO_API_KEY = "env-key";
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "config-token" });

    const { resolveAuthToken } = await import(
      "../../../src/auth/services/resolve-token.js"
    );
    const result = await resolveAuthToken();
    expect(result).toEqual({
      credential: { kind: "apiKey", value: "env-key" },
      source: "env",
    });
  });
});
