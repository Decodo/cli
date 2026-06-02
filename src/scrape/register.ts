import type { Command } from "commander";
import { createTargetCommands } from "./commands/register-targets.js";
import { createTargetsCommand } from "./commands/targets.js";
import { loadSchema, warnIfSpecNewer } from "./services/schema-loader.js";

export async function createScrapeCommands(): Promise<Command[]> {
  const { schema } = await loadSchema();
  warnIfSpecNewer(schema);

  return [createTargetsCommand(schema), ...createTargetCommands(schema)];
}
