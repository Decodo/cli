import type { DecodoSchema, ScrapeRequest } from "@decodo/sdk-ts";
import type { Command } from "commander";
import {
  DEFAULT_MAX_RETRIES,
  getRootOpts,
} from "../../auth/services/global-opts.js";
import { requireAuthToken } from "../../auth/services/resolve-token.js";
import { writeScrapeResponse } from "../../output/services/write-scrape-response.js";
import type { OutputOptions } from "../../output/types/output-options.js";
import type { WriteScrapeResponseContext } from "../../output/types/write-scrape-response.js";
import { handleCliError } from "../../platform/services/handle-cli-error.js";
import { retryWithBackoff } from "../../platform/services/retry-with-backoff.js";
import type {
  OutputContextBuilder,
  ScrapeBodyBuilder,
} from "../types/run-target-scrape.js";
import { createDecodoClient } from "./client.js";
import { buildScrapeBody, getTargetCommandConfig } from "./command-builder.js";

export async function executeScrape(
  token: string,
  schema: DecodoSchema,
  body: Record<string, unknown>,
  options: Record<string, unknown>,
  timeoutMs?: number,
  maxRetries = DEFAULT_MAX_RETRIES,
  outputContext?: Partial<WriteScrapeResponseContext>,
  input?: string
): Promise<void> {
  const client = createDecodoClient(token, schema, timeoutMs);
  const response = await retryWithBackoff(
    () => client.webScrapingApi.scrape(body as unknown as ScrapeRequest),
    { maxRetries }
  );

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

    try {
      const token = await requireAuthToken({ token: rootOpts.token });
      const body = resolveBody(input, options);
      const outputContext = getOutputContext?.(input, options);
      await executeScrape(
        token,
        schema,
        body,
        options,
        rootOpts.timeout,
        rootOpts.maxRetries ?? DEFAULT_MAX_RETRIES,
        outputContext,
        input
      );
    } catch (err) {
      handleCliError(err, { fallbackMessage: "Scrape failed." });
    }
  };
}
