import { ValidationError } from "@decodo/sdk-ts";
import { DEFAULT_CONCURRENCY } from "../constants.js";

/** Commander option parser for `--concurrency`. */
export function parseConcurrency(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new ValidationError("--concurrency must be a positive integer.");
  }
  return parsed;
}

export function resolveConcurrency(value: number | undefined): number {
  return value ?? DEFAULT_CONCURRENCY;
}
