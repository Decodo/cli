import type { Command } from "commander";
import { normalizeArgvForUrlShortcut } from "../../scrape/services/url-shortcut.js";
import { collectCommandNames } from "./collect-command-names.js";

export function prepareArgv(argv: string[], commands: Command[]): string[] {
  const knownCommands = collectCommandNames(commands);
  return normalizeArgvForUrlShortcut(argv, knownCommands);
}
