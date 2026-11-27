import { Command } from "commander";
import { createDataAction } from "../../cli/services/run-data-action.js";
import { attachScrapeOutputOptions } from "../../output/commands/attach-output-options.js";
import { writeJsonOutput } from "../../output/services/write-json-output.js";
import { writeScrapeResponse } from "../../output/services/write-scrape-response.js";
import { assertTaskWaitFlags } from "../services/assert-task-wait-flags.js";
import { getTaskResults } from "../services/get-task-results.js";
import { settleTask } from "../services/settle-task.js";
import type {
  TaskResultsOptions,
  TaskStatusOptions,
} from "../types/task-command.js";
import { attachTaskWaitOptions } from "./attach-task-wait-options.js";

function createTaskStatusCommand(): Command {
  return new Command("status")
    .description("Show the status of an async task as JSON")
    .argument("<id>", "Task id")
    .option("--pretty", "Pretty-print JSON on stdout")
    .action(
      createDataAction<TaskStatusOptions>(
        async ({ api, input, options }) => {
          writeJsonOutput(await api.getStatus(input), options);
        },
        { apiKeyOnly: false }
      )
    );
}

function createTaskResultsCommand(): Command {
  const command = new Command("results")
    .description("Print the result of an async task")
    .argument("<id>", "Task id");

  attachScrapeOutputOptions(command);

  return attachTaskWaitOptions(
    command,
    "Wait for the task to finish before printing its result"
  ).action(
    createDataAction<TaskResultsOptions>(
      async ({ api, input, options }) => {
        assertTaskWaitFlags(options);
        if (options.wait) {
          await settleTask(api, input, options);
        }

        writeScrapeResponse(await getTaskResults(api, input), { options });
      },
      { apiKeyOnly: false }
    )
  );
}

export function createTaskCommand(): Command {
  return new Command("task")
    .description("Check or collect an async task started with --async")
    .addCommand(createTaskStatusCommand())
    .addCommand(createTaskResultsCommand());
}
