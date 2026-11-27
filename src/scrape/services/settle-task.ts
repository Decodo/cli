import type { WebScrapingApi } from "@decodo/sdk-ts";
import { DEFAULT_TASK_TIMEOUT_SECONDS, TASK_FLOW } from "../constants.js";
import { TaskFailedError } from "../errors/task-failed-error.js";
import type { TaskWaitOptions } from "../types/async-options.js";

export async function settleTask(
  { flows }: WebScrapingApi,
  taskId: string,
  options: TaskWaitOptions
): Promise<void> {
  const task = await flows.wait(TASK_FLOW, taskId, {
    pollInterval:
      options.pollInterval === undefined
        ? undefined
        : options.pollInterval * 1000,
    timeout: (options.timeout ?? DEFAULT_TASK_TIMEOUT_SECONDS) * 1000,
  });

  if (flows.hasFailed(TASK_FLOW, task)) {
    const { statusField } = flows.describe(TASK_FLOW, "job");
    throw new TaskFailedError(taskId, String(task[statusField]));
  }
}
