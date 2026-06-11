import type { DecodoSchema, ScrapeRequest } from "@decodo/sdk-ts";
import type { Command } from "commander";
import { AuthRequiredError } from "../../auth/errors/auth-required-error.js";
import { resolveAuthToken } from "../../auth/services/resolve-token.js";
import { resolveConcurrency } from "../../batch/services/resolve-concurrency.js";
import { runBatchCommand } from "../../batch/services/run-batch-command.js";
import type { BatchFlags } from "../../batch/types/batch-flags.js";
import { getRootOpts } from "../../cli/services/global-opts.js";
import { verboseLog } from "../../cli/services/verbose-log.js";
import { extractPayload } from "../../output/services/extract-payload.js";
import { writeScrapeResponse } from "../../output/services/write-scrape-response.js";
import type { OutputOptions } from "../../output/types/output-options.js";
import {
  CliUsageError,
  handleCliError,
} from "../../platform/services/handle-cli-error.js";
import type {
  ExecuteScrapeOptions,
  OutputContextBuilder,
  ScrapeBodyBuilder,
} from "../types/run-target-scrape.js";
import { createDecodoClient } from "./client.js";
import { buildScrapeBody, getTargetCommandConfig } from "./command-builder.js";
import { extractPngFromResponse } from "./extract-png.js";
import { formatScrapeRequestLog } from "./format-scrape-request-log.js";

async function executeScrape({
  token,
  schema,
  body,
  options,
  outputContext,
  input,
  verbose = false,
}: ExecuteScrapeOptions): Promise<void> {
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

interface ExecuteBatchOptions {
  binary: boolean;
  options: Record<string, unknown>;
  resolveBody: ScrapeBodyBuilder;
  schema: DecodoSchema;
  token: string;
  verbose: boolean;
}

async function executeBatch({
  token,
  schema,
  options,
  resolveBody,
  binary,
  verbose,
}: ExecuteBatchOptions): Promise<void> {
  const client = createDecodoClient(token, schema);
  const batch = options as BatchFlags & OutputOptions;
  const full = batch.full === true;

  await runBatchCommand({
    inputFile: batch.inputFile as string,
    inputColumn: batch.inputColumn,
    concurrency: resolveConcurrency(batch.concurrency),
    output: batch.output,
    pretty: batch.pretty,
    binary,
    scrapeItem: async (itemInput) => {
      const body = resolveBody(itemInput, options);
      verboseLog(verbose, formatScrapeRequestLog(body));
      const response = await client.webScrapingApi.scrape(
        body as unknown as ScrapeRequest
      );
      return binary
        ? extractPngFromResponse(response)
        : extractPayload(response, full);
    },
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
      const batchMode = (options as BatchFlags).inputFile !== undefined;
      if (batchMode && input !== undefined) {
        throw new CliUsageError(
          "Cannot combine --input-file with a positional input."
        );
      }
      if (!batchMode && config.primaryField && input === undefined) {
        throw new CliUsageError(`Missing required ${config.primaryField}.`);
      }

      const auth = await resolveAuthToken({ token: rootOpts.token });
      verboseLog(verbose, `auth source=${auth.source}`);
      if (!auth.token) {
        throw new AuthRequiredError();
      }

      if (batchMode) {
        const outputContext = getOutputContext?.(undefined, options);
        await executeBatch({
          token: auth.token,
          schema,
          options,
          resolveBody,
          binary: outputContext?.binary?.kind === "png",
          verbose,
        });
        return;
      }

      const body = resolveBody(input, options);
      verboseLog(verbose, formatScrapeRequestLog(body));
      const outputContext = getOutputContext?.(input, options);
      await executeScrape({
        token: auth.token,
        schema,
        body,
        options,
        outputContext,
        input,
        verbose,
      });
    } catch (err) {
      handleCliError(err, { fallbackMessage: "Scrape failed." });
    }
  };
}
