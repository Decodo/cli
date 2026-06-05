import { writeFileSync } from "node:fs";
import type { SyncResponse } from "@decodo/sdk-ts";
import { ValidationError } from "@decodo/sdk-ts";
import type { WriteScrapeResponseContext } from "../types/write-scrape-response.js";

function extractNdjsonLine(
  entry: SyncResponse["results"][number],
  full: boolean
): unknown {
  if (full) {
    return entry;
  }

  const { content } = entry;
  if (content === undefined || content === null) {
    throw new ValidationError("Scrape response has no content.");
  }

  return content;
}

export function writeNdjsonResults(
  response: SyncResponse,
  context: WriteScrapeResponseContext
): void {
  const { results } = response;
  if (results.length === 0) {
    throw new ValidationError("Scrape response has no results.");
  }

  const full = context.options.full === true;
  const lines: string[] = [];

  for (const entry of results) {
    const payload = extractNdjsonLine(entry, full);
    lines.push(`${JSON.stringify(payload)}\n`);
  }

  const { output } = context.options;
  if (output !== undefined) {
    writeFileSync(output, lines.join(""), "utf8");
    return;
  }

  for (const line of lines) {
    process.stdout.write(line);
  }
}
