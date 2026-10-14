import type { StartCrawlRequest } from "@decodo/sdk-ts";
import type { SiteOptions } from "../../map/types/site-options.js";
import type { JsonOutputOptions } from "../../output/types/json-output-options.js";

export interface CrawlWaitOptions {
  pollInterval?: number;
  progress?: boolean;
  timeout?: number;
  wait?: boolean;
}

export interface CrawlOptions extends SiteOptions, CrawlWaitOptions {
  contentFormat?: StartCrawlRequest["output"];
  maxDepth?: number;
  maxDuration?: number;
  output?: string;
}

export interface CrawlResultsOptions extends CrawlWaitOptions {
  content: boolean;
  output?: string;
}

export type CrawlStatusOptions = JsonOutputOptions;
