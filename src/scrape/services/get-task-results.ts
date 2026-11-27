import type { TaskResultsResponse, WebScrapingApi } from "@decodo/sdk-ts";
import { TaskResultsNotReadyError } from "../errors/task-results-not-ready-error.js";

export async function getTaskResults(
  api: WebScrapingApi,
  taskId: string
): Promise<TaskResultsResponse> {
  const results = await api.getResults(taskId);
  if (results === null) {
    throw new TaskResultsNotReadyError(taskId);
  }
  return results;
}
