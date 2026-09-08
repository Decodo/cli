import { Command, Option } from "commander";
import { getRootOpts } from "../../cli/services/global-opts.js";
import { CliUsageError } from "../../platform/errors/cli-usage-error.js";
import { handleCliError } from "../../platform/services/handle-cli-error.js";
import { promptHidden } from "../../platform/services/prompt-hidden.js";
import { validateCredential } from "../../scrape/services/auth-validation.js";
import { AMBIGUOUS_CREDENTIAL_MESSAGE, PLAYGROUND_URL } from "../constants.js";
import { getConfigPath, writeConfig } from "../services/config.js";
import type { DecodoConfig } from "../types/config.js";
import type { AuthCredential } from "../types/credential.js";

const TOKEN_PROMPT = `Paste your Web Scraping API basic auth token (${PLAYGROUND_URL}): `;

interface SetupOptions {
  apiKey?: string;
  token?: string;
}

function credentialFrom(
  apiKey: string | undefined,
  token: string | undefined
): AuthCredential | undefined {
  if (token) {
    return { kind: "token", value: token };
  }

  if (apiKey) {
    return { kind: "apiKey", value: apiKey };
  }

  return;
}

function toConfig(credential: AuthCredential): DecodoConfig {
  if (credential.kind === "apiKey") {
    return { apiKey: credential.value };
  }

  return { authToken: credential.value };
}

export const setupCommand = new Command("setup")
  .description("Configure the Decodo CLI with your auth token")
  .option(
    "--token <value>",
    "Web Scraping API basic auth token (non-interactive)"
  )
  .addOption(
    new Option("--api-key <value>", "API key (non-interactive)").hideHelp()
  )
  .action(async (options: SetupOptions, command) => {
    const rootOpts = getRootOpts(command);
    const apiKey = (options.apiKey ?? rootOpts.apiKey)?.trim();
    const token = (options.token ?? rootOpts.token)?.trim();

    if (apiKey && token) {
      handleCliError(new CliUsageError(AMBIGUOUS_CREDENTIAL_MESSAGE));
    }

    const credential: AuthCredential = credentialFrom(apiKey, token) ?? {
      kind: "token",
      value: (await promptHidden(TOKEN_PROMPT)).trim(),
    };

    if (!credential.value) {
      handleCliError(new CliUsageError("auth token is required."));
    }

    try {
      await validateCredential(credential);
      await writeConfig(toConfig(credential));
      console.log(`Setup complete. Configuration saved to ${getConfigPath()}`);
    } catch (err) {
      handleCliError(err, { fallbackMessage: "Setup failed." });
    }
  });
