export class CrawlFailedError extends Error {
  readonly crawlId: string;
  readonly status: string;

  constructor(crawlId: string, status: string, reason?: string) {
    super(
      `Crawl ${crawlId} ended with status ${status}${reason ? ` (${reason})` : ""}.`
    );
    this.name = "CrawlFailedError";
    this.crawlId = crawlId;
    this.status = status;
  }
}
