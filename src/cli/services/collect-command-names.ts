import type { Command } from "commander";

export function collectCommandNames(commands: Command[]): Set<string> {
  const names = new Set<string>();

  for (const command of commands) {
    const name = command.name();
    if (name) {
      names.add(name);
    }
  }

  return names;
}
