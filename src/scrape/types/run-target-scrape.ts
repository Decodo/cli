import type { WriteScrapeResponseContext } from "../../output/types/write-scrape-response.js";

export type ScrapeBodyBuilder = (
  input: string | undefined,
  options: Record<string, unknown>
) => Record<string, unknown>;

export type OutputContextBuilder = (
  input: string | undefined,
  options: Record<string, unknown>
) => Partial<WriteScrapeResponseContext>;
