import { describe, expect, it } from "vitest";
import {
  isHttpUrl,
  normalizeArgvForUrlShortcut,
} from "../../../src/scrape/services/url-shortcut.js";

describe("isHttpUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isHttpUrl("https://example.com")).toBe(true);
    expect(isHttpUrl("http://example.com/path")).toBe(true);
  });

  it("rejects non-URL tokens", () => {
    expect(isHttpUrl("setup")).toBe(false);
    expect(isHttpUrl("ftp://example.com")).toBe(false);
    expect(isHttpUrl("//example.com")).toBe(false);
  });
});

describe("normalizeArgvForUrlShortcut", () => {
  const known = new Set(["setup", "scrape", "universal"]);

  it("inserts scrape before a bare URL", () => {
    const argv = ["node", "decodo", "https://example.com", "--token", "t"];
    expect(normalizeArgvForUrlShortcut(argv, known)).toEqual([
      "node",
      "decodo",
      "scrape",
      "https://example.com",
      "--token",
      "t",
    ]);
  });

  it("leaves scrape command unchanged", () => {
    const argv = ["node", "decodo", "scrape", "https://example.com"];
    expect(normalizeArgvForUrlShortcut(argv, known)).toEqual(argv);
  });

  it("leaves known commands unchanged", () => {
    const argv = ["node", "decodo", "setup"];
    expect(normalizeArgvForUrlShortcut(argv, known)).toEqual(argv);
  });

  it("leaves flag-only invocations unchanged", () => {
    const argv = ["node", "decodo", "--help"];
    expect(normalizeArgvForUrlShortcut(argv, known)).toEqual(argv);
  });
});
