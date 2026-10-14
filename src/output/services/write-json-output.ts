import type { JsonOutputOptions } from "../types/json-output-options.js";
import { resolvePrettyIndent } from "./resolve-pretty.js";
import { writeTextOutput } from "./write-text-output.js";

export function writeJsonOutput(
  payload: unknown,
  options: JsonOutputOptions
): void {
  writeTextOutput(
    JSON.stringify(payload, null, resolvePrettyIndent(options)),
    options
  );
}
