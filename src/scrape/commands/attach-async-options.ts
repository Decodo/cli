import type { Command } from "commander";
import { attachTaskWaitOptions } from "./attach-task-wait-options.js";

export function attachAsyncOptions(command: Command): Command {
  command.option(
    "--async",
    "Create an async task and print it with its id instead of waiting for the result"
  );

  return attachTaskWaitOptions(
    command,
    "Wait for the task to finish and print the result (with --async)"
  );
}
