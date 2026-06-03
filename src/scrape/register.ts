import type { Command } from "commander";
import { createScrapeCommand } from "./commands/scrape.js";
import { createTargetCommands } from "./commands/target-commands.js";
import { createTargetsCommand } from "./commands/targets.js";
import { loadSchema } from "./services/schema-loader.js";

export async function createScrapeCommands(): Promise<Command[]> {
  const schema = await loadSchema();

  return [
    createScrapeCommand(schema),
    createTargetsCommand(schema),
    ...createTargetCommands(schema),
  ];
}
