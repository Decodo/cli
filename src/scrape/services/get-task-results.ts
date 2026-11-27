import type { SyncResponse, WebScrapingApi } from "@decodo/sdk-ts";
import { TASK_FLOW } from "../constants.js";
import { TaskResultsNotReadyError } from "../errors/task-results-not-ready-error.js";

export async function getTaskResults(
  api: WebScrapingApi,
  taskId: string
): Promise<SyncResponse> {
  const results = await api.flows.results(TASK_FLOW, taskId);
  if (results === undefined || results === null) {
    throw new TaskResultsNotReadyError(taskId);
  }
  return results as SyncResponse;
}
