import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "@decodo/sdk-ts";
import { PLAYGROUND_URL } from "../../auth/constants.js";
import { AuthRequiredError } from "../../auth/errors/auth-required-error.js";
import { EXIT } from "../constants.js";
import { CliUsageError } from "../errors/cli-usage-error.js";

const EXIT_SIGNAL_PREFIX = "process.exit:";

const NETWORK_ERROR_CODES = new Set([
  "ENOTFOUND",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
]);

function findNetworkCause(
  err: unknown
): { code: string; message: string } | undefined {
  const seen = new Set<unknown>();
  let current: unknown = err;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && NETWORK_ERROR_CODES.has(code)) {
      const message = (current as { message?: unknown }).message;
      return { code, message: typeof message === "string" ? message : code };
    }
    current = (current as { cause?: unknown }).cause;
  }

  return;
}

export function resolveCliExitCode(err: unknown): number {
  if (err instanceof CliUsageError) {
    return EXIT.USAGE;
  }

  if (err instanceof AuthRequiredError || err instanceof AuthenticationError) {
    return EXIT.AUTH;
  }

  if (err instanceof ValidationError) {
    return EXIT.VALIDATION;
  }

  if (err instanceof RateLimitError) {
    return EXIT.RATE_LIMIT;
  }

  if (err instanceof TimeoutError) {
    return EXIT.TIMEOUT;
  }

  if (err instanceof DecodoError) {
    return EXIT.NETWORK;
  }

  if (findNetworkCause(err)) {
    return EXIT.NETWORK;
  }

  return EXIT.ERROR;
}

function extractValidationDetails(err: ValidationError): string[] {
  const rawErrors = (err as { errors?: unknown }).errors;
  if (!Array.isArray(rawErrors)) {
    return [];
  }

  return rawErrors
    .map((detail) => {
      if (typeof detail === "string") {
        return detail;
      }

      if (
        detail &&
        typeof detail === "object" &&
        "message" in detail &&
        typeof (detail as { message?: unknown }).message === "string"
      ) {
        return (detail as { message: string }).message;
      }

      try {
        return JSON.stringify(detail);
      } catch {
        return String(detail);
      }
    })
    .filter((detail) => detail.length > 0);
}

function resolveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.length > 0) {
    return err.message;
  }

  if (typeof err === "string" && err.length > 0) {
    return err;
  }

  return fallback;
}

export function handleCliError(
  err: unknown,
  options: { fallbackMessage?: string } = {}
): never {
  if (err instanceof Error && err.message.startsWith(EXIT_SIGNAL_PREFIX)) {
    throw err;
  }

  const message = resolveErrorMessage(
    err,
    options.fallbackMessage ?? "Command failed."
  );
  const exitCode = resolveCliExitCode(err);

  console.error(`Error: ${message}`);

  const networkCause = findNetworkCause(err);
  if (networkCause) {
    console.error(`Cause: ${networkCause.code} (${networkCause.message})`);
  }

  if (err instanceof ValidationError) {
    const details = extractValidationDetails(err);
    if (details.length > 0) {
      console.error("Validation details:");
      for (const detail of details) {
        console.error(`- ${detail}`);
      }
    }
  }

  if (err instanceof AuthRequiredError) {
    console.error(
      "\nThe Decodo CLI is installed and working - it just needs an auth token:\n" +
        `  1. Get your Web Scraping API token at ${PLAYGROUND_URL}\n` +
        "  2. Run `decodo setup` to save it (or set DECODO_AUTH_TOKEN)\n" +
        "  3. Re-run your command"
    );
  } else if (err instanceof AuthenticationError) {
    console.error("Hint: Run `decodo setup` to configure your auth token.");
  }

  if (err instanceof RateLimitError) {
    console.error("Hint: Wait and retry, or lower request concurrency.");
  }

  process.exit(exitCode);
}
