import type { Command } from "commander";

export interface RootOptions {
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
