import type { GetCrawlStatusResponse, WebScrapingApi } from "@decodo/sdk-ts";
import {
  DEFAULT_CRAWL_TIMEOUT_SECONDS,
  DEFAULT_POLL_INTERVAL_SECONDS,
  PARTIAL_CRAWL_STATUSES,
} from "../constants.js";
import type { CrawlWaitOptions } from "../types/crawl-command.js";
import { formatCrawlProgress } from "./format-crawl-progress.js";
import { waitForCrawl } from "./wait-for-crawl.js";

export async function settleCrawl(
  api: WebScrapingApi,
  crawlId: string,
  options: CrawlWaitOptions
): Promise<GetCrawlStatusResponse> {
  const status = await waitForCrawl(api, crawlId, {
    pollIntervalMs:
      (options.pollInterval ?? DEFAULT_POLL_INTERVAL_SECONDS) * 1000,
    timeoutMs: (options.timeout ?? DEFAULT_CRAWL_TIMEOUT_SECONDS) * 1000,
    onStatus: options.progress
      ? (current) => process.stderr.write(`${formatCrawlProgress(current)}\n`)
      : undefined,
  });

  if (PARTIAL_CRAWL_STATUSES.has(status.status)) {
    console.error(
      `Warning: crawl ${crawlId} ended with status ${status.status}${status.reason ? ` (${status.reason})` : ""}`
    );
  }

  return status;
}
