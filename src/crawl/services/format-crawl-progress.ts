import type { GetCrawlStatusResponse } from "@decodo/sdk-ts";

export function formatCrawlProgress(status: GetCrawlStatusResponse): string {
  return `crawl ${status.crawl_id} ${status.status}: ${status.completed}/${status.discovered} pages, ${status.failed} failed, ${status.in_flight} in flight`;
}
