import type { ResultEntry, SyncResponse } from "@decodo/sdk-ts";
import { ScrapeFailedError } from "../errors/scrape-failed-error.js";

const HTTP_ERROR_THRESHOLD = 400;

function readString(
  source: Record<string, unknown>,
  key: string
): string | undefined {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readNumber(
  source: Record<string, unknown>,
  key: string
): number | undefined {
  const value = source[key];
  return typeof value === "number" ? value : undefined;
}

function failureFromContent(content: unknown): ScrapeFailedError | undefined {
  if (typeof content !== "object" || content === null) {
    return;
  }

  const envelope = content as Record<string, unknown>;
  if (envelope.status !== "failed") {
    return;
  }

  const statusCode = readNumber(envelope, "status_code");
  const message =
    readString(envelope, "message") ??
    (statusCode === undefined
      ? "Scrape failed."
      : `Scrape failed with status ${statusCode}.`);

  return new ScrapeFailedError(message, statusCode);
}

function failureFromStatus(entry: ResultEntry): ScrapeFailedError | undefined {
  const { status_code: statusCode } = entry;
  if (typeof statusCode !== "number" || statusCode < HTTP_ERROR_THRESHOLD) {
    return;
  }

  const message =
    (typeof entry.content === "object" && entry.content !== null
      ? readString(entry.content as Record<string, unknown>, "message")
      : undefined) ?? `Scrape request returned status ${statusCode}.`;

  return new ScrapeFailedError(message, statusCode);
}

export function detectScrapeFailure(
  response: SyncResponse
): ScrapeFailedError | undefined {
  for (const entry of response.results) {
    const failure =
      failureFromContent(entry.content) ?? failureFromStatus(entry);
    if (failure) {
      return failure;
    }
  }

  return;
}
