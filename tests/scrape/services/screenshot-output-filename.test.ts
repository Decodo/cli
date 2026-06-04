import { describe, expect, it } from "vitest";
import { defaultScreenshotFilename } from "../../../src/scrape/services/screenshot-output-filename.js";

describe("defaultScreenshotFilename", () => {
  it("derives filename from URL hostname", () => {
    expect(defaultScreenshotFilename("https://ip.decodo.com/page")).toBe(
      "ip.decodo.com.png"
    );
  });

  it("falls back when URL is missing or invalid", () => {
    expect(defaultScreenshotFilename(undefined)).toBe("screenshot.png");
    expect(defaultScreenshotFilename("not-a-url")).toBe("screenshot.png");
  });
});
