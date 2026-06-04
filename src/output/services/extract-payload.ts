import type { SyncResponse } from "@decodo/sdk-ts";
import { ValidationError } from "@decodo/sdk-ts";

export function extractPayload(response: SyncResponse, full: boolean): unknown {
  if (full) {
    return response;
  }

  const entry = response.results[0];
  if (entry === undefined) {
    throw new ValidationError("Scrape response has no results.");
  }

  const { content } = entry;
  if (content === undefined || content === null) {
    throw new ValidationError("Scrape response has no content.");
  }

  return content;
}
