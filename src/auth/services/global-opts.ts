import type { Command } from "commander";

export const DEFAULT_MAX_RETRIES = 3;

export interface RootOptions {
  maxRetries?: number;
  timeout?: number;
  token?: string;
  verbose?: boolean;
}

export function getRootOpts(command: Command): RootOptions {
  let current: Command = command;

  while (current.parent) {
    current = current.parent;
  }

  return current.opts() as RootOptions;
}
