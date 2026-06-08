import type { OutputOptions } from "../types/output-options.js";

export function resolvePrettyIndent(
  options: OutputOptions
): number | undefined {
  if (options.pretty !== undefined) {
    return options.pretty ? 2 : undefined;
  }

  return process.stdout.isTTY ? 2 : undefined;
}
