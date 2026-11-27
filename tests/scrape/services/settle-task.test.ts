import type { WebScrapingApi } from "@decodo/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { TaskFailedError } from "../../../src/scrape/errors/task-failed-error.js";
import { settleTask } from "../../../src/scrape/services/settle-task.js";

function apiWith(status: string) {
  const flows = {
    wait: vi.fn().mockResolvedValue({ id: "123", status }),
    hasFailed: vi.fn().mockReturnValue(status === "faulted"),
    describe: vi.fn().mockReturnValue({ statusField: "status" }),
  };
  return { api: { flows } as unknown as WebScrapingApi, flows };
}

describe("settleTask", () => {
  it("waits on the task flow with the default timeout", async () => {
    const { api, flows } = apiWith("done");

    await expect(settleTask(api, "123", {})).resolves.toBe(undefined);
    expect(flows.wait).toHaveBeenCalledWith("task", "123", {
      pollInterval: undefined,
      timeout: 600_000,
    });
  });

  it("passes the poll interval and timeout in milliseconds", async () => {
    const { api, flows } = apiWith("done");

    await settleTask(api, "123", { pollInterval: 2, timeout: 30 });

    expect(flows.wait).toHaveBeenCalledWith("task", "123", {
      pollInterval: 2000,
      timeout: 30_000,
    });
  });

  it("throws a TaskFailedError when the flow reports a failed task", async () => {
    const { api } = apiWith("faulted");

    await expect(settleTask(api, "123", {})).rejects.toThrow(
      new TaskFailedError("123", "faulted")
    );
  });
});
