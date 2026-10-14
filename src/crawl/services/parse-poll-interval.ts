import { InvalidArgumentError } from "commander";
import { parsePositiveInt } from "../../cli/services/parse-positive-int.js";
import { MAX_POLL_INTERVAL_SECONDS } from "../constants.js";

export function parsePollInterval(value: string): number {
  const parsed = parsePositiveInt(value);
  if (parsed > MAX_POLL_INTERVAL_SECONDS) {
    throw new InvalidArgumentError(
      `Must be at most ${MAX_POLL_INTERVAL_SECONDS}.`
    );
  }
  return parsed;
}
