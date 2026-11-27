import { setTimeout as sleep } from "node:timers/promises";
import {
  type TaskMetadata,
  TimeoutError,
  type WebScrapingApi,
} from "@decodo/sdk-ts";
import { PENDING_TASK_STATUS } from "../constants.js";

export interface WaitForTaskOptions {
  pollIntervalMs: number;
  timeoutMs: number;
}

export async function waitForTask(
  api: WebScrapingApi,
  taskId: string,
  { pollIntervalMs, timeoutMs }: WaitForTaskOptions
): Promise<TaskMetadata> {
  const deadline = Date.now() + timeoutMs;
  let task = await api.getStatus(taskId);

  while (task.status === PENDING_TASK_STATUS) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new TimeoutError(
        `Task ${taskId} did not finish within ${timeoutMs / 1000}s. It is still running.`
      );
    }
    await sleep(Math.min(pollIntervalMs, remainingMs));
    task = await api.getStatus(taskId);
  }

  return task;
}
