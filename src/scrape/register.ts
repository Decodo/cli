import type { Command } from "commander";
import { createCodegenJobCommands } from "./commands/codegen-job-commands.js";
import { createCodegenTargetCommands } from "./commands/codegen-target-commands.js";
import { createListTargetsCommand } from "./commands/list-targets.js";
import { createScrapeCommand } from "./commands/scrape.js";
import { createScreenshotCommand } from "./commands/screenshot.js";
import { loadSchema } from "./services/schema-loader.js";

export async function createScrapeCommands(): Promise<Command[]> {
  const schema = await loadSchema();

  return [
    createScrapeCommand(schema),
    createScreenshotCommand(schema),
    ...createCodegenJobCommands(schema),
    createListTargetsCommand(schema),
    ...createCodegenTargetCommands(schema),
  ];
}
