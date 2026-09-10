import { AuthenticationError } from "@decodo/sdk-ts";
import { Command } from "commander";
import { getRootOpts } from "../../cli/services/global-opts.js";
import { CliUsageError } from "../../platform/errors/cli-usage-error.js";
import { handleCliError } from "../../platform/services/handle-cli-error.js";
import { promptHidden } from "../../platform/services/prompt-hidden.js";
import { validateCredential } from "../../scrape/services/auth-validation.js";
import { AUTH_TYPE, PLAYGROUND_URL } from "../constants.js";
import { getConfigPath, writeConfig } from "../services/config.js";
import { detectCredentialType } from "../services/detect-credential-type.js";
import type { DecodoConfig } from "../types/config.js";
import type { AuthCredential, AuthType } from "../types/credential.js";

const TOKEN_PROMPT = `Paste your Web Scraping API auth token (${PLAYGROUND_URL}): `;

interface SetupOptions {
  token?: string;
}

function oppositeAuthType(type: AuthType): AuthType {
  return type === AUTH_TYPE.TOKEN ? AUTH_TYPE.API_KEY : AUTH_TYPE.TOKEN;
}

function toConfig(credential: AuthCredential): DecodoConfig {
  if (credential.type === AUTH_TYPE.API_KEY) {
    return { apiKey: credential.value };
  }

  return { authToken: credential.value };
}

async function verifyCredential(value: string): Promise<AuthCredential> {
  const detected: AuthCredential = {
    type: detectCredentialType(value),
    value,
  };

  try {
    await validateCredential(detected);
    return detected;
  } catch (err) {
    if (!(err instanceof AuthenticationError)) {
      throw err;
    }

    const fallback: AuthCredential = {
      type: oppositeAuthType(detected.type),
      value,
    };

    try {
      await validateCredential(fallback);
    } catch {
      throw err;
    }

    return fallback;
  }
}

export const setupCommand = new Command("setup")
  .description("Configure the Decodo CLI with your auth token")
  .option("--token <value>", "Web Scraping API auth token (non-interactive)")
  .action(async (options: SetupOptions, command) => {
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
      const credential = await verifyCredential(token);
      await writeConfig(toConfig(credential));
      console.log(`Setup complete. Configuration saved to ${getConfigPath()}`);
    } catch (err) {
      handleCliError(err, { fallbackMessage: "Setup failed." });
    }
  });
