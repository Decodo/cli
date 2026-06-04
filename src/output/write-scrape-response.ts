import type { DecodoSchema, SyncResponse } from "@decodo/sdk-ts";
import { extractPayload } from "./extract-payload.js";
import { renderOutput } from "./render-output.js";
import { resolveOutputFormat } from "./resolve-format.js";
import { resolvePrettyIndent } from "./resolve-pretty.js";
import type { OutputOptions } from "./types.js";
import { writeTextOutput } from "./write-text-output.js";

export interface WriteScrapeResponseContext {
  options: OutputOptions;
  schema: DecodoSchema;
  target: string;
}

export function writeScrapeResponse(
  response: SyncResponse,
  context: WriteScrapeResponseContext
): void {
  const { schema, target, options } = context;
  const full = options.full === true;
  const format = resolveOutputFormat(options, target, schema);
  const indent = resolvePrettyIndent(options);
  const payload = extractPayload(response, full);
  const text = renderOutput(payload, format, indent, full);

  writeTextOutput(text, { output: options.output });
}
