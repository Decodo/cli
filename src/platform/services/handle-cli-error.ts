import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "@decodo/sdk-ts";
import { AuthRequiredError } from "../../auth/errors/auth-required-error.js";
import { EXIT } from "../constants.js";

const EXIT_SIGNAL_PREFIX = "process.exit:";

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
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
  if (
    err instanceof Error &&
    err.message.startsWith(EXIT_SIGNAL_PREFIX)
  ) {
    throw err;
  }

  const message = resolveErrorMessage(
    err,
    options.fallbackMessage ?? "Command failed."
  );
  const exitCode = resolveCliExitCode(err);

  console.error(`Error: ${message}`);

  if (err instanceof ValidationError) {
    const details = extractValidationDetails(err);
    if (details.length > 0) {
      console.error("Validation details:");
      for (const detail of details) {
        console.error(`- ${detail}`);
      }
    }
  }

  if (err instanceof AuthRequiredError || err instanceof AuthenticationError) {
    console.error("Hint: Run `decodo setup` to configure your auth token.");
  }

  if (err instanceof RateLimitError) {
    console.error("Hint: Wait and retry, or lower request concurrency.");
  }

  process.exit(exitCode);
}
