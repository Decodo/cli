import type { DecodoSchema, ScrapeRequest } from "@decodo/sdk-ts";
import type { Command } from "commander";
import { AuthRequiredError } from "../../auth/errors/auth-required-error.js";
import { resolveAuthToken } from "../../auth/services/resolve-token.js";
import { getRootOpts } from "../../cli/services/global-opts.js";
import { verboseLog } from "../../cli/services/verbose-log.js";
import { writeScrapeResponse } from "../../output/services/write-scrape-response.js";
import type { OutputOptions } from "../../output/types/output-options.js";
import type { WriteScrapeResponseContext } from "../../output/types/write-scrape-response.js";
import { handleCliError } from "../../platform/services/handle-cli-error.js";
import type {
  OutputContextBuilder,
  ScrapeBodyBuilder,
} from "../types/run-target-scrape.js";
import { createDecodoClient } from "./client.js";
import { buildScrapeBody, getTargetCommandConfig } from "./command-builder.js";
import { formatScrapeRequestLog } from "./format-scrape-request-log.js";

export async function executeScrape(
  token: string,
  schema: DecodoSchema,
  body: Record<string, unknown>,
  options: Record<string, unknown>,
  outputContext?: Partial<WriteScrapeResponseContext>,
  input?: string,
  verbose = false
): Promise<void> {
  const client = createDecodoClient(token, schema);
  const startedAt = Date.now();
  const response = await client.webScrapingApi.scrape(
    body as unknown as ScrapeRequest
  );
  verboseLog(verbose, `response latency_ms=${Date.now() - startedAt}`);

  writeScrapeResponse(response, {
    options: options as OutputOptions,
    input,
    ...outputContext,
  });
}

export function createTargetAction(
  target: string,
  schema: DecodoSchema,
  buildBody?: ScrapeBodyBuilder,
  getOutputContext?: OutputContextBuilder
) {
  const config = getTargetCommandConfig(target, schema);
  const resolveBody =
    buildBody ??
    ((input, options) =>
      buildScrapeBody(target, input, options, config, schema));

  return async (
    input: string | undefined,
    options: Record<string, unknown>,
    command: Command
  ): Promise<void> => {
    const rootOpts = getRootOpts(command);
    const verbose = rootOpts.verbose === true;

    try {
      const auth = await resolveAuthToken({ token: rootOpts.token });
      verboseLog(verbose, `auth source=${auth.source}`);
      if (!auth.token) {
        throw new AuthRequiredError();
      }

      const body = resolveBody(input, options);
      verboseLog(verbose, formatScrapeRequestLog(body));
      const outputContext = getOutputContext?.(input, options);
      await executeScrape(
        auth.token,
        schema,
        body,
        options,
        outputContext,
        input,
        verbose
      );
    } catch (err) {
      handleCliError(err, { fallbackMessage: "Scrape failed." });
    }
  };
}
