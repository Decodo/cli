import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "@decodo/sdk-ts";

const BASE_DELAY_MS = 1000;

export interface RetryWithBackoffOptions {
  maxRetries: number;
  onRetry?: (attempt: number) => void;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof AuthenticationError) {
    return false;
  }

  if (error instanceof ValidationError) {
    return false;
  }

  if (error instanceof TimeoutError) {
    return false;
  }

  if (error instanceof RateLimitError) {
    return true;
  }

  if (error instanceof DecodoError) {
    return error.statusCode >= 500 && error.statusCode <= 599;
  }

  return false;
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryWithBackoffOptions
): Promise<T> {
  const maxRetries = Math.max(0, options.maxRetries);

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      options.onRetry?.(attempt + 1);
      await wait(BASE_DELAY_MS * 2 ** attempt);
    }
  }
}
