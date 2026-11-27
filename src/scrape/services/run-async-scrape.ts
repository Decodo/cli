import type { ScrapeRequest, WebScrapingApi } from "@decodo/sdk-ts";
import { writeJsonOutput } from "../../output/services/write-json-output.js";
import { writeScrapeResponse } from "../../output/services/write-scrape-response.js";
import type { OutputOptions } from "../../output/types/output-options.js";
import type { WriteScrapeResponseContext } from "../../output/types/write-scrape-response.js";
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
  const task = await api.scrapeAsync(body as unknown as ScrapeRequest);

  if (!options.wait) {
    writeJsonOutput(task, options);
    return;
  }

  process.stderr.write(`task ${task.id} started\n`);
  await settleTask(api, task.id, options);

  writeScrapeResponse(await getTaskResults(api, task.id), {
    options,
    input,
    ...outputContext,
  });
}
