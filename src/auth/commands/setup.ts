import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { Command } from "commander";
import {
  CliUsageError,
  handleCliError,
} from "../../platform/services/handle-cli-error.js";
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
      handleCliError(new CliUsageError("auth token is required."));
    }

    try {
      await validateAuthToken(token);
      await writeConfig({ authToken: token });
      console.log(`Setup complete. Configuration saved to ${getConfigPath()}`);
    } catch (err) {
      handleCliError(err, { fallbackMessage: "Setup failed." });
    }
  });
