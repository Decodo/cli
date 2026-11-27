import { CliUsageError } from "../../platform/errors/cli-usage-error.js";
import { TASK_WAIT_ONLY_FLAGS } from "../constants.js";
import type { TaskWaitOptions } from "../types/async-options.js";

export function assertTaskWaitFlags(options: TaskWaitOptions): void {
  if (options.wait) {
    return;
  }

  for (const [key, flag] of Object.entries(TASK_WAIT_ONLY_FLAGS)) {
    if (options[key as keyof TaskWaitOptions] !== undefined) {
      throw new CliUsageError(`${flag} requires --wait.`);
    }
  }
}
