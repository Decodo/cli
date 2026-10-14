import type { GetCrawlStatusResponse } from "@decodo/sdk-ts";
import { FAILED_CRAWL_STATUS } from "../constants.js";
import { CrawlFailedError } from "../errors/crawl-failed-error.js";

export function assertCrawlSucceeded(status: GetCrawlStatusResponse): void {
  if (status.status === FAILED_CRAWL_STATUS) {
    throw new CrawlFailedError(status.crawl_id, status.status, status.reason);
  }
}
