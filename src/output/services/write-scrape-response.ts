import type { SyncResponse } from "@decodo/sdk-ts";
import { writeBinaryOutput } from "../../platform/services/write-binary.js";
import { extractPngFromResponse } from "../../scrape/services/extract-png.js";
import { defaultScreenshotFilename } from "../../scrape/services/screenshot-output-filename.js";
import type { WriteScrapeResponseContext } from "../types/write-scrape-response.js";
import { extractPayload } from "./extract-payload.js";
import { renderPayload } from "./render-output.js";
import { resolvePrettyIndent } from "./resolve-pretty.js";
import { writeNdjsonResults } from "./write-ndjson-results.js";
import { writeTextOutput } from "./write-text-output.js";

export function writeScrapeResponse(
  response: SyncResponse,
  context: WriteScrapeResponseContext
): void {
  const { options } = context;

  if (context.binary?.kind === "png") {
    writeBinaryOutput(extractPngFromResponse(response), {
      output: options.output,
      defaultFileName:
        context.binary.defaultFileName ??
        defaultScreenshotFilename(context.input),
    });
    return;
  }

  if (options.format === "ndjson") {
    writeNdjsonResults(response, context);
    return;
  }

  const full = options.full === true;
  const indent = resolvePrettyIndent(options);
  const payload = extractPayload(response, full);
  const text = full
    ? JSON.stringify(payload, null, indent)
    : renderPayload(payload, indent);

  writeTextOutput(text, { output: options.output });
}
