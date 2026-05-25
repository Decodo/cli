import { Command } from "commander";
import { clearConfig } from "../services/config.js";

export const logoutCommand = new Command("logout")
  .description("Remove saved CLI configuration")
  .action(async () => {
    await clearConfig();
    console.log("Configuration cleared.");
  });
