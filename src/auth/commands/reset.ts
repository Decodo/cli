import { Command } from "commander";
import { clearConfig } from "../services/config.js";

export const resetCommand = new Command("reset")
  .description("Remove saved CLI configuration")
  .action(async () => {
    await clearConfig();
    console.log("Configuration cleared.");
  });
