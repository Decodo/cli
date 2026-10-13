import type { GetCrawlStatusResponse } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { formatCrawlProgress } from "../../../src/crawl/services/format-crawl-progress.js";

describe("formatCrawlProgress", () => {
  it("summarises page counts", () => {
    const status = {
      crawl_id: "abc",
      status: "pending",
      completed: 3,
      discovered: 10,
      failed: 1,
      in_flight: 2,
    } as GetCrawlStatusResponse;

    expect(formatCrawlProgress(status)).toBe(
      "crawl abc pending: 3/10 pages, 1 failed, 2 in flight"
    );
  });
});
