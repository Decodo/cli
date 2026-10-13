import { TimeoutError, type WebScrapingApi } from "@decodo/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { waitForCrawl } from "../../../src/crawl/services/wait-for-crawl.js";

function apiReturning(...statuses: string[]): WebScrapingApi {
  const getCrawlStatus = vi.fn();
  for (const status of statuses) {
    getCrawlStatus.mockResolvedValueOnce({ crawl_id: "abc", status });
  }
  return { getCrawlStatus } as unknown as WebScrapingApi;
}

describe("waitForCrawl", () => {
  it("polls until the crawl settles and reports each status", async () => {
    const api = apiReturning("pending", "pending", "done");
    const onStatus = vi.fn();

    const status = await waitForCrawl(api, "abc", {
      pollIntervalMs: 1,
      timeoutMs: 1000,
      onStatus,
    });

    expect(status.status).toBe("done");
    expect(api.getCrawlStatus).toHaveBeenCalledTimes(3);
    expect(onStatus).toHaveBeenCalledTimes(3);
  });

  it("returns a settled status without waiting", async () => {
    const api = apiReturning("cancelled");

    const status = await waitForCrawl(api, "abc", {
      pollIntervalMs: 1000,
      timeoutMs: 1,
    });

    expect(status.status).toBe("cancelled");
  });

  it("throws a TimeoutError naming the cancel command", async () => {
    const api = apiReturning("pending");

    await expect(
      waitForCrawl(api, "abc", { pollIntervalMs: 2000, timeoutMs: 1000 })
    ).rejects.toThrow(
      new TimeoutError(
        "Crawl abc did not finish within 1s. It is still running; run `decodo crawl cancel abc` to stop it."
      )
    );
  });
});
