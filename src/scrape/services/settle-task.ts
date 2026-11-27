import type { WebScrapingApi } from "@decodo/sdk-ts";
import {
  DEFAULT_TASK_POLL_INTERVAL_SECONDS,
  DEFAULT_TASK_TIMEOUT_SECONDS,
  DONE_TASK_STATUS,
} from "../constants.js";
import { TaskFailedError } from "../errors/task-failed-error.js";
import type { TaskWaitOptions } from "../types/async-options.js";
import { waitForTask } from "./wait-for-task.js";

export async function settleTask(
  api: WebScrapingApi,
  taskId: string,
  options: TaskWaitOptions
): Promise<void> {
  const task = await waitForTask(api, taskId, {
    pollIntervalMs:
      (options.pollInterval ?? DEFAULT_TASK_POLL_INTERVAL_SECONDS) * 1000,
    timeoutMs: (options.timeout ?? DEFAULT_TASK_TIMEOUT_SECONDS) * 1000,
  });

  if (task.status !== DONE_TASK_STATUS) {
    throw new TaskFailedError(taskId, task.status);
  }
}
