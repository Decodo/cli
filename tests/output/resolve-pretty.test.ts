import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePrettyIndent } from "../../src/output/resolve-pretty.js";

describe("resolvePrettyIndent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses indent 2 when --pretty is set", () => {
    expect(resolvePrettyIndent({ pretty: true })).toBe(2);
  });

  it("uses compact JSON when --pretty is false", () => {
    expect(resolvePrettyIndent({ pretty: false })).toBeUndefined();
  });

  it("defaults to pretty on TTY", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: true,
      configurable: true,
    });

    expect(resolvePrettyIndent({})).toBe(2);
  });

  it("defaults to compact when piped", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });

    expect(resolvePrettyIndent({})).toBeUndefined();
  });
});
