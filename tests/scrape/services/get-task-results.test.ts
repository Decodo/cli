import type { WebScrapingApi } from "@decodo/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { TaskResultsNotReadyError } from "../../../src/scrape/errors/task-results-not-ready-error.js";
import { getTaskResults } from "../../../src/scrape/services/get-task-results.js";

function apiReturning(results: unknown): WebScrapingApi {
  return {
    flows: { results: vi.fn().mockResolvedValue(results) },
  } as unknown as WebScrapingApi;
}

describe("getTaskResults", () => {
  it("returns the results of a finished task", async () => {
    const results = { results: [{ content: { ok: true } }] };

    await expect(
      getTaskResults(apiReturning(results), "task", "123")
    ).resolves.toBe(results);
  });

  it("throws a TaskResultsNotReadyError when there are no results yet", async () => {
    await expect(
      getTaskResults(apiReturning(undefined), "task", "123")
    ).rejects.toThrow(new TaskResultsNotReadyError("task", "123"));
  });
});
