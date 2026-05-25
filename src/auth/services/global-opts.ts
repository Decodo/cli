import type { Command } from 'commander';

export function getRootOpts(command: Command): { token?: string } {
  let current: Command = command;
  
  while (current.parent) {
    current = current.parent;
  }
  
  return current.opts() as { token?: string };
}
