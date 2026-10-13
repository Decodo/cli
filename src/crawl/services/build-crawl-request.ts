import type { StartCrawlRequest } from "@decodo/sdk-ts";
import { buildSiteRequest } from "../../map/services/build-site-request.js";
import type { CrawlOptions } from "../types/crawl-command.js";

export function buildCrawlRequest(
  url: string,
  options: CrawlOptions
): StartCrawlRequest {
  const request: StartCrawlRequest = buildSiteRequest(url, options);
  if (options.maxDepth !== undefined) {
    request.max_depth = options.maxDepth;
  }
  if (options.maxDuration !== undefined) {
    request.max_duration = options.maxDuration;
  }
  if (options.contentFormat !== undefined) {
    request.output = options.contentFormat;
  }
  return request;
}
