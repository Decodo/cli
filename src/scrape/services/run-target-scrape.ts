import type { DecodoSchema, ScrapeRequest } from "@decodo/sdk-ts";
import type { Command } from "commander";
import { AuthRequiredError } from "../../auth/errors/auth-required-error.js";
import {
  DEFAULT_MAX_RETRIES,
  getRootOpts,
} from "../../auth/services/global-opts.js";
import { resolveAuthToken } from "../../auth/services/resolve-token.js";
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

const SENSITIVE_QUERY_PARAM_KEYS = new Set([
  "auth",
  "authorization",
  "apikey",
  "api_key",
  "key",
  "password",
  "secret",
  "token",
]);

function verboseLog(enabled: boolean, message: string): void {
  if (!enabled) {
    return;
  }

  process.stderr.write(`[verbose] ${message}\n`);
}

function sanitizeUrlForLog(value: string): string {
  try {
    const parsed = new URL(value);
    for (const key of parsed.searchParams.keys()) {
      if (SENSITIVE_QUERY_PARAM_KEYS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, "<redacted>");
      }
    }
    return parsed.toString();
  } catch {
    return value;
  }
}

function formatRequestLog(body: Record<string, unknown>): string {
  const target = typeof body.target === "string" ? body.target : "unknown";
  const url = typeof body.url === "string" ? sanitizeUrlForLog(body.url) : null;
  if (url !== null) {
    return `request target=${target} url=${url}`;
  }

  const query = typeof body.query === "string" ? body.query : null;
  if (query !== null) {
    return `request target=${target} query=${query}`;
  }

  return `request target=${target}`;
}

export async function executeScrape(
  token: string,
  schema: DecodoSchema,
  body: Record<string, unknown>,
  options: Record<string, unknown>,
  timeoutMs?: number,
  maxRetries = DEFAULT_MAX_RETRIES,
  outputContext?: Partial<WriteScrapeResponseContext>,
  input?: string,
  verbose = false
): Promise<void> {
  const client = createDecodoClient(token, schema, timeoutMs);
  let attemptStartedAt = 0;
  const response = await retryWithBackoff(
    async () => {
      attemptStartedAt = Date.now();
      const result = await client.webScrapingApi.scrape(
        body as unknown as ScrapeRequest
      );
      verboseLog(
        verbose,
        `response latency_ms=${Date.now() - attemptStartedAt}`
      );
      return result;
    },
    {
      maxRetries,
      onRetry: (attempt) => {
        verboseLog(verbose, `retry attempt=${attempt}`);
      },
    }
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
    const verbose = rootOpts.verbose === true;

    try {
      const auth = await resolveAuthToken({ token: rootOpts.token });
      verboseLog(verbose, `auth source=${auth.source}`);
      if (!auth.token) {
        throw new AuthRequiredError();
      }

      const body = resolveBody(input, options);
      verboseLog(verbose, formatRequestLog(body));
      const outputContext = getOutputContext?.(input, options);
      await executeScrape(
        auth.token,
        schema,
        body,
        options,
        rootOpts.timeout,
        rootOpts.maxRetries ?? DEFAULT_MAX_RETRIES,
        outputContext,
        input,
        verbose
      );
    } catch (err) {
      handleCliError(err, { fallbackMessage: "Scrape failed." });
    }
  };
}
