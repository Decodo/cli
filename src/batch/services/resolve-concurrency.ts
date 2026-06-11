import { CliUsageError } from "../../platform/services/handle-cli-error.js";
import { DEFAULT_CONCURRENCY } from "../constants.js";

export function parseConcurrency(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new CliUsageError("--concurrency must be a positive integer.");
  }
  return parsed;
}

export function resolveConcurrency(value: number | undefined): number {
  return value ?? DEFAULT_CONCURRENCY;
}
