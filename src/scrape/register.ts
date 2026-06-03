import type { Command } from "commander";
import { createTargetCommands } from "./commands/target-commands.js";
import { createTargetsCommand } from "./commands/targets.js";
import { loadSchema } from "./services/schema-loader.js";

export async function createScrapeCommands(): Promise<Command[]> {
  const schema = await loadSchema();

  return [createTargetsCommand(schema), ...createTargetCommands(schema)];
}
