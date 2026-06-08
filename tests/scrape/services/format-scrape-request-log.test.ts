import { describe, expect, it } from "vitest";
import { formatScrapeRequestLog } from "../../../src/scrape/services/format-scrape-request-log.js";

describe("formatScrapeRequestLog", () => {
  it("formats query-based requests", () => {
    expect(
      formatScrapeRequestLog({ target: "google_search", query: "coffee" })
    ).toBe("request target=google_search query=coffee");
  });

  it("redacts sensitive URL query params", () => {
    expect(
      formatScrapeRequestLog({
        target: "universal",
        url: "https://example.com?token=secret&page=1",
      })
    ).toBe(
      "request target=universal url=https://example.com/?token=%3Credacted%3E&page=1"
    );
  });

  it("redacts compound sensitive URL query params", () => {
    expect(
      formatScrapeRequestLog({
        target: "universal",
        url: "https://example.com?access_token=secret&page=1",
      })
    ).toBe(
      "request target=universal url=https://example.com/?access_token=%3Credacted%3E&page=1"
    );
  });

  it("falls back to target only when body has no url or query", () => {
    expect(formatScrapeRequestLog({ target: "amazon_product" })).toBe(
      "request target=amazon_product"
    );
  });
});
