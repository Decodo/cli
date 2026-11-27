import type {
  DecodoSchema,
  FlowSchema,
  IrJobFlow,
  IrSurfaceTool,
} from "@decodo/sdk-ts";
import { Command } from "commander";
import { createDataAction } from "../../cli/services/run-data-action.js";
import { attachScrapeOutputOptions } from "../../output/commands/attach-output-options.js";
import { writeJsonOutput } from "../../output/services/write-json-output.js";
import { writeScrapeResponse } from "../../output/services/write-scrape-response.js";
import { INTEGRATION_HEADER } from "../constants.js";
import { assertTaskWaitFlags } from "../services/assert-task-wait-flags.js";
import { getTaskResults } from "../services/get-task-results.js";
import { snakeToKebab } from "../services/naming.js";
import { settleTask } from "../services/settle-task.js";
import type {
  TaskResultsOptions,
  TaskStatusOptions,
} from "../types/task-command.js";
import { attachTaskWaitOptions } from "./attach-task-wait-options.js";

function createJobResultsCommand(
  command: Command,
  tool: IrSurfaceTool,
  schema: DecodoSchema
): Command {
  attachScrapeOutputOptions(command);

  return attachTaskWaitOptions(
    command,
    `Wait for the ${tool.flow} to finish before printing its result`
  ).action(
    createDataAction<TaskResultsOptions>(async ({ api, input, options }) => {
      assertTaskWaitFlags(options);
      if (options.wait) {
        await settleTask(api, tool.flow, input, options);
      }

      writeScrapeResponse(await getTaskResults(api, tool.flow, input), {
        options,
      });
    }, schema)
  );
}

function createJobStepCommand(
  tool: IrSurfaceTool,
  flow: IrJobFlow,
  schema: DecodoSchema
): Command {
  const command = new Command(tool.step)
    .description(tool.description)
    .argument("<id>", tool.descriptions?.[flow.idField] ?? `${tool.flow} id`);

  if (tool.step === "results") {
    return createJobResultsCommand(command, tool, schema);
  }

  return command.option("--pretty", "Pretty-print JSON on stdout").action(
    createDataAction<TaskStatusOptions>(async ({ api, input, options }) => {
      const job =
        tool.step === "cancel"
          ? await api.flows.cancel(tool.flow, input)
          : await api.flows.status(tool.flow, input);
      writeJsonOutput(job, options);
    }, schema)
  );
}

export function createCodegenJobCommands(schema: DecodoSchema): Command[] {
  const flowSchema = schema as Partial<FlowSchema>;
  const tools = flowSchema.getSurface?.(INTEGRATION_HEADER)?.tools ?? [];
  const commands = new Map<string, Command>();

  for (const tool of tools) {
    const flow = flowSchema.getFlow?.(tool.flow);
    if (flow?.pattern !== "job" || !tool.step || tool.step === "start") {
      continue;
    }

    const command =
      commands.get(tool.flow) ??
      new Command(snakeToKebab(tool.flow)).description(
        `Follow up on a ${tool.flow} started earlier`
      );
    commands.set(tool.flow, command);
    command.addCommand(createJobStepCommand(tool, flow, schema));
  }

  return [...commands.values()];
}
