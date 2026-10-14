import { describe, expect, it } from "vitest";
import { buildCrawlRequest } from "../../../src/crawl/services/build-crawl-request.js";

describe("buildCrawlRequest", () => {
  it("adds crawl-only fields to the site request", () => {
    expect(
      buildCrawlRequest("https://example.com", {
        limit: 5,
        maxDepth: 2,
        maxDuration: 60,
        contentFormat: "html",
        wait: true,
        output: "pages.ndjson",
      })
    ).toEqual({
      url: "https://example.com",
      limit: 5,
      max_depth: 2,
      max_duration: 60,
      output: "html",
    });
  });

  it("sends only the url when no options are set", () => {
    expect(buildCrawlRequest("https://example.com", {})).toEqual({
      url: "https://example.com",
    });
  });
});
