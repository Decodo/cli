import { CliUsageError } from "../../platform/errors/cli-usage-error.js";
import type { AsyncOptions } from "../types/async-options.js";
import { assertTaskWaitFlags } from "./assert-task-wait-flags.js";

export function assertAsyncFlags(options: AsyncOptions): void {
  if (options.wait && !options.async) {
    throw new CliUsageError("--wait requires --async.");
  }

  assertTaskWaitFlags(options);
}
