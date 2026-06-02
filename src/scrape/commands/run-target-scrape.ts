import {
  AuthenticationError,
  DecodoError,
  type DecodoSchema,
  type ScrapeRequest,
  ValidationError,
} from "@decodo/sdk-ts";
import type { Command } from "commander";
import { AuthRequiredError } from "../../auth/errors/auth-required-error.js";
import { getRootOpts } from "../../auth/services/global-opts.js";
import { requireAuthToken } from "../../auth/services/resolve-token.js";
import { EXIT } from "../../platform/constants.js";
import { createDecodoClient } from "../services/client.js";
import {
  buildScrapeBody,
  getTargetCommandConfig,
} from "../services/command-builder.js";

export function createTargetAction(target: string, schema: DecodoSchema) {
  const config = getTargetCommandConfig(target, schema);

  return async (
    input: string | undefined,
    options: Record<string, unknown>,
    command: Command
  ): Promise<void> => {
    const rootOpts = getRootOpts(command);

    try {
      const token = await requireAuthToken({ token: rootOpts.token });
      const body = buildScrapeBody(target, input, options, config);
      const client = createDecodoClient(token, schema);
      const response = await client.webScrapingApi.scrape(
        body as unknown as ScrapeRequest
      );

      console.log(JSON.stringify(response, null, 2));
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        console.error(err.message);
        process.exit(EXIT.AUTH);
      }

      if (err instanceof AuthenticationError) {
        console.error(`Error: ${err.message}`);
        process.exit(EXIT.AUTH);
      }

      if (err instanceof ValidationError) {
        console.error(`Error: ${err.message}`);
        process.exit(EXIT.USAGE);
      }

      if (err instanceof DecodoError) {
        console.error(`Error: ${err.message}`);
        process.exit(EXIT.ERROR);
      }

      console.error(
        `Error: ${err instanceof Error ? err.message : "Scrape failed."}`
      );
      process.exit(EXIT.ERROR);
    }
  };
}
