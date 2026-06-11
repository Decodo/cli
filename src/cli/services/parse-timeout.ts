import { CliUsageError } from "../../platform/services/handle-cli-error.js";

export function parseTimeout(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new CliUsageError(
      "--timeout must be a positive integer (milliseconds)."
    );
  }
  return parsed;
}
