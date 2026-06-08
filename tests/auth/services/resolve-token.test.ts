import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

describe("resolveAuthToken", () => {
  let restoreConfigHome: () => void;
  let previousEnvToken: string | undefined;

  beforeEach(async () => {
    ({ restore: restoreConfigHome } = await isolateConfigHome());
    previousEnvToken = process.env.DECODO_AUTH_TOKEN;
    delete process.env.DECODO_AUTH_TOKEN;
    vi.resetModules();
  });

  afterEach(() => {
    restoreConfigHome();
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
