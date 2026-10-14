import type { GetCrawlStatusResponse } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { CrawlFailedError } from "../../../src/crawl/errors/crawl-failed-error.js";
import { assertCrawlSucceeded } from "../../../src/crawl/services/assert-crawl-succeeded.js";

function statusOf(status: string): GetCrawlStatusResponse {
  return { crawl_id: "abc", status } as GetCrawlStatusResponse;
}

describe("assertCrawlSucceeded", () => {
  it.each([
    "done",
    "truncated",
    "cancelled",
  ])("accepts a %s crawl", (status) => {
    expect(() => assertCrawlSucceeded(statusOf(status))).not.toThrow();
  });

  it("throws for a faulted crawl", () => {
    expect(() => assertCrawlSucceeded(statusOf("faulted"))).toThrow(
      CrawlFailedError
    );
  });
});
