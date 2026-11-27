import type { Command } from "commander";
import { parsePositiveInt } from "../../cli/services/parse-positive-int.js";
import { parsePollInterval } from "../../crawl/services/parse-poll-interval.js";
import {
  DEFAULT_TASK_POLL_INTERVAL_SECONDS,
  DEFAULT_TASK_TIMEOUT_SECONDS,
} from "../constants.js";

export function attachTaskWaitOptions(
  command: Command,
  waitHelp: string
): Command {
  return command
    .option("--wait", waitHelp)
    .option(
      "--poll-interval <seconds>",
      `Seconds between status checks (with --wait, default: ${DEFAULT_TASK_POLL_INTERVAL_SECONDS})`,
      parsePollInterval
    )
    .option(
      "--timeout <seconds>",
      `Give up waiting after this many seconds (with --wait, default: ${DEFAULT_TASK_TIMEOUT_SECONDS})`,
      parsePositiveInt
    );
}
