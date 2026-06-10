import { Command } from "commander";
import { getRootOpts } from "../../cli/services/global-opts.js";
import {
  CliUsageError,
  handleCliError,
} from "../../platform/services/handle-cli-error.js";
import { promptHidden } from "../../platform/services/prompt-hidden.js";
import { validateAuthToken } from "../../scrape/services/auth-validation.js";
import { PLAYGROUND_URL } from "../constants.js";
import { getConfigPath, writeConfig } from "../services/config.js";

const TOKEN_PROMPT = `Paste your Web Scraping API basic auth token (${PLAYGROUND_URL}): `;

export const setupCommand = new Command("setup")
  .description("Configure the Decodo CLI with your auth token")
  .option(
    "--token <value>",
    "Web Scraping API basic auth token (non-interactive)"
  )
  .action(async (options: { token?: string }, command) => {
    const rootOpts = getRootOpts(command);
    const token = (
      options.token?.trim() ||
      rootOpts.token?.trim() ||
      (await promptHidden(TOKEN_PROMPT))
    ).trim();

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
