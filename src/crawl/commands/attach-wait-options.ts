import type { Command } from "commander";
import { parsePositiveInt } from "../../cli/services/parse-positive-int.js";
import {
  DEFAULT_CRAWL_TIMEOUT_SECONDS,
  DEFAULT_POLL_INTERVAL_SECONDS,
} from "../constants.js";

export function attachWaitOptions(command: Command, waitHelp: string): Command {
  return command
    .option("--wait", waitHelp)
    .option("--progress", "Print crawl progress to stderr (with --wait)")
    .option(
      "--poll-interval <seconds>",
      `Seconds between status checks (with --wait, default: ${DEFAULT_POLL_INTERVAL_SECONDS})`,
      parsePositiveInt
    )
    .option(
      "--timeout <seconds>",
      `Give up waiting after this many seconds (with --wait, default: ${DEFAULT_CRAWL_TIMEOUT_SECONDS})`,
      parsePositiveInt
    );
}
