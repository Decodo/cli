import { setTimeout as sleep } from "node:timers/promises";
import {
  type GetCrawlStatusResponse,
  TimeoutError,
  type WebScrapingApi,
} from "@decodo/sdk-ts";

export interface WaitForCrawlOptions {
  onStatus?: (status: GetCrawlStatusResponse) => void;
  pollIntervalMs: number;
  timeoutMs: number;
}

export async function waitForCrawl(
  api: WebScrapingApi,
  crawlId: string,
  { onStatus, pollIntervalMs, timeoutMs }: WaitForCrawlOptions
): Promise<GetCrawlStatusResponse> {
  const deadline = Date.now() + timeoutMs;
  let status = await api.getCrawlStatus(crawlId);
  onStatus?.(status);

  while (status.status === "pending") {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new TimeoutError(
        `Crawl ${crawlId} did not finish within ${timeoutMs / 1000}s. It is still running; run \`decodo crawl cancel ${crawlId}\` to stop it.`
      );
    }
    await sleep(Math.min(pollIntervalMs, remainingMs));
    status = await api.getCrawlStatus(crawlId);
    onStatus?.(status);
  }

  return status;
}
