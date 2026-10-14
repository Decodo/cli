import { describe, expect, it } from "vitest";
import { CrawlFailedError } from "../../../src/crawl/errors/crawl-failed-error.js";

describe("CrawlFailedError", () => {
  it("names the crawl, its status and the reason", () => {
    const err = new CrawlFailedError("abc", "faulted", "upstream_error");
    expect(err.message).toBe(
      "Crawl abc ended with status faulted (upstream_error)."
    );
    expect(err.name).toBe("CrawlFailedError");
    expect(err.crawlId).toBe("abc");
    expect(err.status).toBe("faulted");
  });

  it("omits the reason when there is none", () => {
    expect(new CrawlFailedError("abc", "faulted").message).toBe(
      "Crawl abc ended with status faulted."
    );
  });
});
