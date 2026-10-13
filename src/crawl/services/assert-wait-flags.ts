import { CliUsageError } from "../../platform/errors/cli-usage-error.js";
import { WAIT_ONLY_FLAGS } from "../constants.js";
import type { CrawlWaitOptions } from "../types/crawl-command.js";

export function assertWaitFlags(
  options: CrawlWaitOptions & { output?: string },
  waitOnlyFlags: Readonly<Record<string, string>> = WAIT_ONLY_FLAGS
): void {
  if (options.wait) {
    return;
  }

  for (const [key, flag] of Object.entries(waitOnlyFlags)) {
    if (options[key as keyof typeof options] !== undefined) {
      throw new CliUsageError(`${flag} requires --wait.`);
    }
  }
}
