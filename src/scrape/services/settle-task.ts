import type { WebScrapingApi } from "@decodo/sdk-ts";
import { DEFAULT_TASK_TIMEOUT_SECONDS } from "../constants.js";
import { TaskFailedError } from "../errors/task-failed-error.js";
import type { TaskWaitOptions } from "../types/async-options.js";

export async function settleTask(
  { flows }: WebScrapingApi,
  flow: string,
  taskId: string,
  options: TaskWaitOptions
): Promise<void> {
  const task = await flows.wait(flow, taskId, {
    pollInterval:
      options.pollInterval === undefined
        ? undefined
        : options.pollInterval * 1000,
    timeout: (options.timeout ?? DEFAULT_TASK_TIMEOUT_SECONDS) * 1000,
  });

  if (flows.hasFailed(flow, task)) {
    const { statusField } = flows.describe(flow, "job");
    throw new TaskFailedError(flow, taskId, String(task[statusField]));
  }
}
