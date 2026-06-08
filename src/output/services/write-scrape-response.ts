import type { SyncResponse } from "@decodo/sdk-ts";
import type { WriteScrapeResponseContext } from "../types/write-scrape-response.js";
import { extractPayload } from "./extract-payload.js";
import { renderPayload } from "./render-output.js";
import { resolvePrettyIndent } from "./resolve-pretty.js";
import { writeTextOutput } from "./write-text-output.js";

export function writeScrapeResponse(
  response: SyncResponse,
  context: WriteScrapeResponseContext
): void {
  const { options } = context;
  const full = options.full === true;
  const indent = resolvePrettyIndent(options);
  const payload = extractPayload(response, full);
  const text = full
    ? JSON.stringify(payload, null, indent)
    : renderPayload(payload, indent);

  writeTextOutput(text, { output: options.output });
}
