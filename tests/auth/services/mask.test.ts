import { describe, expect, it } from "vitest";

describe("mask", () => {
  it("shows prefix and suffix with negative length", async () => {
    const { mask } = await import("../../../src/auth/services/mask.js");
    expect(mask("abcdefghijklmnop", 4, -4)).toBe("abcd...mnop");
  });

  it("returns placeholder when value is too short", async () => {
    const { mask } = await import("../../../src/auth/services/mask.js");
    expect(mask("short", 4, -4)).toBe("****");
  });
});
