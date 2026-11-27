import type { SyncResponse, WebScrapingApi } from "@decodo/sdk-ts";
import { TaskResultsNotReadyError } from "../errors/task-results-not-ready-error.js";

export async function getTaskResults(
  api: WebScrapingApi,
  flow: string,
  taskId: string
): Promise<SyncResponse> {
  const results = await api.flows.results(flow, taskId);
  if (results === undefined || results === null) {
    throw new TaskResultsNotReadyError(flow, taskId);
  }
  return results as SyncResponse;
}
