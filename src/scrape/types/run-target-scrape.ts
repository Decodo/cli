import type { DecodoSchema } from "@decodo/sdk-ts";
import type { WriteScrapeResponseContext } from "../../output/types/write-scrape-response.js";

export interface ExecuteScrapeOptions {
  body: Record<string, unknown>;
  input?: string;
  options: Record<string, unknown>;
  outputContext?: Partial<WriteScrapeResponseContext>;
  schema: DecodoSchema;
  token: string;
  verbose?: boolean;
}

export type ScrapeBodyBuilder = (
  input: string | undefined,
  options: Record<string, unknown>
) => Record<string, unknown>;

export type OutputContextBuilder = (
  input: string | undefined,
  options: Record<string, unknown>
) => Partial<WriteScrapeResponseContext>;
