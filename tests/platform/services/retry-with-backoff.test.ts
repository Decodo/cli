import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "@decodo/sdk-ts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { retryWithBackoff } from "../../../src/platform/services/retry-with-backoff.js";

describe("retryWithBackoff", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("retries on 429 and eventually succeeds", async () => {
    vi.useFakeTimers();

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new RateLimitError("Rate limit exceeded"))
      .mockResolvedValue("ok");

    const promise = retryWithBackoff(operation, { maxRetries: 3 });

    expect(operation).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("retries on 5xx errors with exponential backoff", async () => {
    vi.useFakeTimers();

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new DecodoError("Server error", 500))
      .mockRejectedValueOnce(new DecodoError("Server error", 502))
      .mockRejectedValueOnce(new DecodoError("Server error", 503))
      .mockResolvedValue("ok");

    const promise = retryWithBackoff(operation, { maxRetries: 3 });

    expect(operation).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(999);
    expect(operation).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(operation).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1999);
    expect(operation).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(operation).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(3999);
    expect(operation).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it("does not retry authentication, validation, or timeout errors", async () => {
    const nonRetriableErrors = [
      new AuthenticationError("Unauthorized"),
      new ValidationError("Invalid payload"),
      new TimeoutError("Gateway timeout"),
    ];

    for (const error of nonRetriableErrors) {
      const operation = vi.fn<() => Promise<string>>().mockRejectedValue(error);

      await expect(
        retryWithBackoff(operation, { maxRetries: 3 })
      ).rejects.toBe(error);
      expect(operation).toHaveBeenCalledTimes(1);
    }
  });

  it("respects maxRetries for retriable errors", async () => {
    vi.useFakeTimers();

    const error = new RateLimitError("Rate limit exceeded");
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(error);
    const promise = retryWithBackoff(operation, { maxRetries: 1 });
    const rejected = expect(promise).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    await rejected;
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-5xx Decodo errors", async () => {
    const error = new DecodoError("Bad request", 400);
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(error);

    await expect(retryWithBackoff(operation, { maxRetries: 3 })).rejects.toBe(
      error
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
