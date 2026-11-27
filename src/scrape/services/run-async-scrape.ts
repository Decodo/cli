import type { WebScrapingApi } from "@decodo/sdk-ts";
import { writeJsonOutput } from "../../output/services/write-json-output.js";
import { writeScrapeResponse } from "../../output/services/write-scrape-response.js";
import type { OutputOptions } from "../../output/types/output-options.js";
import type { WriteScrapeResponseContext } from "../../output/types/write-scrape-response.js";
import { TASK_FLOW } from "../constants.js";
import type { AsyncOptions } from "../types/async-options.js";
import { getTaskResults } from "./get-task-results.js";
import { settleTask } from "./settle-task.js";

export interface RunAsyncScrapeOptions {
  body: Record<string, unknown>;
  input?: string;
  options: AsyncOptions & OutputOptions;
  outputContext?: Partial<WriteScrapeResponseContext>;
}

export async function runAsyncScrape(
  api: WebScrapingApi,
  { body, input, options, outputContext }: RunAsyncScrapeOptions
): Promise<void> {
  const task = await api.flows.start(TASK_FLOW, body);

  if (!options.wait) {
    writeJsonOutput(task, options);
    return;
  }

  const taskId = String(task[api.flows.describe(TASK_FLOW, "job").idField]);
  process.stderr.write(`task ${taskId} started\n`);
  await settleTask(api, taskId, options);

  writeScrapeResponse(await getTaskResults(api, taskId), {
    options,
    input,
    ...outputContext,
  });
}
