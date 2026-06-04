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

export type ScrapeBodyBuilder = (
  input: string | undefined,
  options: Record<string, unknown>
) => Record<string, unknown>;

function handleScrapeError(err: unknown): never {
  if (err instanceof Error && err.message.startsWith("process.exit:")) {
    throw err;
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

async function executeScrape(
  token: string,
  schema: DecodoSchema,
  body: Record<string, unknown>
): Promise<void> {
  const client = createDecodoClient(token, schema);
  const response = await client.webScrapingApi.scrape(
    body as unknown as ScrapeRequest
  );

  console.log(JSON.stringify(response, null, 2));
}

export function createTargetAction(
  target: string,
  schema: DecodoSchema,
  buildBody?: ScrapeBodyBuilder
) {
  const config = getTargetCommandConfig(target, schema);
  const resolveBody =
    buildBody ??
    ((input, options) => buildScrapeBody(target, input, options, config));

  return async (
    input: string | undefined,
    options: Record<string, unknown>,
    command: Command
  ): Promise<void> => {
    const rootOpts = getRootOpts(command);

    try {
      const token = await requireAuthToken({ token: rootOpts.token });
      const body = resolveBody(input, options);
      await executeScrape(token, schema, body);
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        console.error(err.message);
        process.exit(EXIT.AUTH);
      }

      handleScrapeError(err);
    }
  };
}
