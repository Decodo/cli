import type { Command } from "commander";
import { createCodegenTargetCommands } from "./commands/codegen-target-commands.js";
import { createListTargetsCommand } from "./commands/list-targets.js";
import { createScrapeCommand } from "./commands/scrape.js";
import { createScreenshotCommand } from "./commands/screenshot.js";
import { createSearchCommand } from "./commands/search.js";
import { loadSchema } from "./services/schema-loader.js";

export async function createScrapeCommands(): Promise<Command[]> {
  const schema = await loadSchema();

  return [
    createScrapeCommand(schema),
    createSearchCommand(schema),
    createScreenshotCommand(schema),
    createListTargetsCommand(schema),
    ...createCodegenTargetCommands(schema),
  ];
}
