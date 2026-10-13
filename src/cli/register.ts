import type { Command } from "commander";
import { createResetCommand } from "../auth/commands/reset.js";
import { createSetupCommand } from "../auth/commands/setup.js";
import { createWhoamiCommand } from "../auth/commands/whoami.js";
import { createCrawlCommand } from "../crawl/commands/crawl.js";
import { createMapCommand } from "../map/commands/map.js";
import { createScrapeCommands } from "../scrape/register.js";
import { createSearchCommand } from "../search/commands/search.js";
import { sortCommandsByOrder } from "./services/sort-commands-by-order.js";

export async function createCommands(): Promise<Command[]> {
  return sortCommandsByOrder([
    createSetupCommand(),
    createResetCommand(),
    createWhoamiCommand(),
    createSearchCommand(),
    createMapCommand(),
    createCrawlCommand(),
    ...(await createScrapeCommands()),
  ]);
}
