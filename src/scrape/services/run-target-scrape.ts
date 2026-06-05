import type { DecodoSchema, ScrapeRequest } from "@decodo/sdk-ts";
import type { Command } from "commander";
import { getRootOpts } from "../../auth/services/global-opts.js";
import { requireAuthToken } from "../../auth/services/resolve-token.js";
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

export function handleScrapeError(err: unknown): never {
  handleCliError(err, { fallbackMessage: "Scrape failed." });
}

export async function executeScrape(
  token: string,
  schema: DecodoSchema,
  body: Record<string, unknown>,
  options: Record<string, unknown>,
  outputContext?: Partial<WriteScrapeResponseContext>,
  input?: string
): Promise<void> {
  const client = createDecodoClient(token, schema);
  const response = await client.webScrapingApi.scrape(
    body as unknown as ScrapeRequest
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
      await executeScrape(token, schema, body, options, outputContext, input);
    } catch (err) {
      handleScrapeError(err);
    }
  };
}
