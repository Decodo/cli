import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { AuthenticationError, DecodoError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { EXIT } from "../../platform/constants.js";
import { validateAuthToken } from "../../scrape/services/auth-validation.js";
import { PLAYGROUND_URL } from "../constants.js";
import { getConfigPath, writeConfig } from "../services/config.js";
import { getRootOpts } from "../services/global-opts.js";

const TOKEN_PROMPT = `Paste your Web Scraping API basic auth token (${PLAYGROUND_URL}): `;

async function promptForToken(): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const token = await rl.question(TOKEN_PROMPT);

    return token.trim();
  } finally {
    rl.close();
  }
}

export const setupCommand = new Command("setup")
  .description("Configure the Decodo CLI with your auth token")
  .option(
    "--token <value>",
    "Web Scraping API basic auth token (non-interactive)"
  )
  .action(async (options: { token?: string }, command) => {
    const rootOpts = getRootOpts(command);
    const token =
      options.token?.trim() ||
      rootOpts.token?.trim() ||
      (await promptForToken());

    if (!token) {
      console.error("Error: auth token is required.");
      process.exit(EXIT.USAGE);
    }

    try {
      await validateAuthToken(token);
      await writeConfig({ authToken: token });
      console.log(`Setup complete. Configuration saved to ${getConfigPath()}`);
    } catch (err) {
      if (err instanceof AuthenticationError) {
        console.error(`Error: ${err.message}`);
        process.exit(EXIT.AUTH);
      }

      if (err instanceof DecodoError) {
        console.error(`Error: ${err.message}`);
        process.exit(EXIT.ERROR);
      }

      console.error(
        `Error: ${err instanceof Error ? err.message : "Setup failed."}`
      );

      process.exit(EXIT.ERROR);
    }
  });
