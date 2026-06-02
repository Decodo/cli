import type { Command } from "commander";
import { resetCommand } from "../auth/commands/reset.js";
import { setupCommand } from "../auth/commands/setup.js";
import { whoamiCommand } from "../auth/commands/whoami.js";
import { createScrapeCommands } from "../scrape/register.js";

export async function createCommands(): Promise<Command[]> {
  return [
    setupCommand,
    resetCommand,
    whoamiCommand,
    ...(await createScrapeCommands()),
  ];
}
