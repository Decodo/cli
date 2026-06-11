import { describe, expect, it } from "vitest";
import { batchItemFilename } from "../../src/batch/services/batch-item-filename.js";

describe("batchItemFilename", () => {
  it("slugs a URL from host and path, dropping the query", () => {
    expect(batchItemFilename("https://example.com/a/b?x=1", 0)).toBe(
      "example.com-a-b"
    );
  });

  it("falls back to the row index for non-URL input", () => {
    expect(batchItemFilename("how to scrape", 3)).toBe("item-3");
  });

  it("truncates very long slugs", () => {
    const long = `https://example.com/${"a".repeat(300)}`;
    expect(batchItemFilename(long, 0).length).toBeLessThanOrEqual(100);
  });
});
