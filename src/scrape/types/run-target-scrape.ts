import type { SyncResponse } from "@decodo/sdk-ts";

export type ScrapeBodyBuilder = (
  input: string | undefined,
  options: Record<string, unknown>
) => Record<string, unknown>;

export type ScrapeResponseHandler = (
  response: SyncResponse,
  options: Record<string, unknown>
) => void | Promise<void>;
