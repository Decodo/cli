import { TimeoutError, type WebScrapingApi } from "@decodo/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { waitForTask } from "../../../src/scrape/services/wait-for-task.js";

function apiReturning(...statuses: string[]): WebScrapingApi {
  const getStatus = vi.fn();
  for (const status of statuses) {
    getStatus.mockResolvedValueOnce({ id: "123", status });
  }
  return { getStatus } as unknown as WebScrapingApi;
}

describe("waitForTask", () => {
  it("polls until the task is no longer pending", async () => {
    const api = apiReturning("pending", "pending", "done");

    const task = await waitForTask(api, "123", {
      pollIntervalMs: 1,
      timeoutMs: 1000,
    });

    expect(task.status).toBe("done");
    expect(api.getStatus).toHaveBeenCalledTimes(3);
  });

  it("returns a finished task without waiting", async () => {
    const api = apiReturning("faulted");

    const task = await waitForTask(api, "123", {
      pollIntervalMs: 1000,
      timeoutMs: 1,
    });

    expect(task.status).toBe("faulted");
    expect(api.getStatus).toHaveBeenCalledTimes(1);
  });

  it("uses the time left before the deadline instead of giving up early", async () => {
    const api = apiReturning("pending", "done");

    const task = await waitForTask(api, "123", {
      pollIntervalMs: 60_000,
      timeoutMs: 20,
    });

    expect(task.status).toBe("done");
    expect(api.getStatus).toHaveBeenCalledTimes(2);
  });

  it("throws a TimeoutError naming the task id", async () => {
    const api = apiReturning("pending", "pending");

    await expect(
      waitForTask(api, "123", { pollIntervalMs: 2000, timeoutMs: 1000 })
    ).rejects.toThrow(
      new TimeoutError(
        "Task 123 did not finish within 1s. It is still running."
      )
    );
  });
});
