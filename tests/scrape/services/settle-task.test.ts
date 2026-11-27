import type { WebScrapingApi } from "@decodo/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { TaskFailedError } from "../../../src/scrape/errors/task-failed-error.js";
import { settleTask } from "../../../src/scrape/services/settle-task.js";

function apiWith(status: string): WebScrapingApi {
  return {
    getStatus: vi.fn().mockResolvedValue({ id: "123", status }),
  } as unknown as WebScrapingApi;
}

describe("settleTask", () => {
  it("resolves when the task is done", async () => {
    await expect(settleTask(apiWith("done"), "123", {})).resolves.toBe(
      undefined
    );
  });

  it("throws a TaskFailedError when the task is faulted", async () => {
    await expect(settleTask(apiWith("faulted"), "123", {})).rejects.toThrow(
      new TaskFailedError("123", "faulted")
    );
  });
});
