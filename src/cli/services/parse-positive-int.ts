import { InvalidArgumentError } from "commander";

export function parsePositiveInt(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new InvalidArgumentError("Must be a positive integer.");
  }
  return parsed;
}
