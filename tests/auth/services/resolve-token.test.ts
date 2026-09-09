import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isolateConfigHome } from "../../platform/helpers/config-home.js";

const BASIC_TOKEN = "VTAwMDAwMDAwMDA6UFdfZXhhbXBsZXNlY3JldA==";
const API_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

async function resolve(options?: { token?: string }) {
  const { resolveAuthToken } = await import(
    "../../../src/auth/services/resolve-token.js"
  );
  return resolveAuthToken(options);
}

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

  it("prefers the flag over env and config", async () => {
    process.env.DECODO_AUTH_TOKEN = BASIC_TOKEN;
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "config-token" });

    expect(await resolve({ token: BASIC_TOKEN })).toEqual({
      credential: { type: "token", value: BASIC_TOKEN },
      source: "flag",
    });
  });

  it("infers an api key passed through --token", async () => {
    expect(await resolve({ token: API_KEY })).toEqual({
      credential: { type: "apiKey", value: API_KEY },
      source: "flag",
    });
  });

  it("infers an api key from DECODO_AUTH_TOKEN", async () => {
    process.env.DECODO_AUTH_TOKEN = API_KEY;

    expect(await resolve()).toEqual({
      credential: { type: "apiKey", value: API_KEY },
      source: "env",
    });
  });

  it("prefers env over config", async () => {
    process.env.DECODO_AUTH_TOKEN = BASIC_TOKEN;
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: "config-token" });

    expect(await resolve()).toEqual({
      credential: { type: "token", value: BASIC_TOKEN },
      source: "env",
    });
  });

  it("uses the persisted kind for a saved api key without re-detecting", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ apiKey: BASIC_TOKEN });

    expect(await resolve()).toEqual({
      credential: { type: "apiKey", value: BASIC_TOKEN },
      source: "config",
    });
  });

  it("reads a saved auth token from config", async () => {
    const { writeConfig } = await import(
      "../../../src/auth/services/config.js"
    );
    await writeConfig({ authToken: BASIC_TOKEN });

    expect(await resolve()).toEqual({
      credential: { type: "token", value: BASIC_TOKEN },
      source: "config",
    });
  });

  it("returns none when no credential is available", async () => {
    expect(await resolve()).toEqual({
      credential: undefined,
      source: "none",
    });
  });

  it("treats a whitespace-only flag as no credential", async () => {
    expect(await resolve({ token: "   " })).toEqual({
      credential: undefined,
      source: "none",
    });
  });

  it("trims surrounding whitespace before detecting", async () => {
    expect(await resolve({ token: `  ${API_KEY}\n` })).toEqual({
      credential: { type: "apiKey", value: API_KEY },
      source: "flag",
    });
  });
});
