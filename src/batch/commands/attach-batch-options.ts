import type { Command } from "commander";
import { parseConcurrency } from "../services/resolve-concurrency.js";

export function attachBatchOptions(command: Command): Command {
  return command
    .option(
      "--input-file <path>",
      "Run each line/row of a .txt or .csv file as a batch item"
    )
    .option(
      "--input-column <name>",
      "Column to read inputs from when --input-file is a CSV"
    )
    .option(
      "--concurrency <n>",
      "Max requests to run in parallel in batch mode (default: 4)",
      parseConcurrency
    );
}
