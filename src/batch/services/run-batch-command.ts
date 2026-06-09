import { ValidationError } from "@decodo/sdk-ts";
import { CliUsageError } from "../../platform/services/handle-cli-error.js";
import type { BatchSummary } from "../types/batch-result.js";
import type { BatchSink } from "../types/batch-sink.js";
import { createBinaryDirectorySink } from "./binary-directory-sink.js";
import { createDirectorySink } from "./directory-sink.js";
import { createNdjsonStdoutSink } from "./ndjson-stdout-sink.js";
import { readInputFile } from "./read-input-file.js";
import { runBatch } from "./run-batch.js";

export interface RunBatchCommandOptions {
  /** Target produces binary output (e.g. screenshots). Requires `output`. */
  binary?: boolean;
  concurrency: number;
  inputColumn?: string;
  inputFile: string;
  /** Output directory; when set, one file per item is written here. */
  output?: string;
  pretty?: boolean;
  /** Runs a single input; resolves to the payload (or bytes) to emit. */
  scrapeItem: (input: string) => Promise<unknown>;
}

function selectSink(options: RunBatchCommandOptions): BatchSink {
  if (options.binary) {
    if (!options.output) {
      throw new CliUsageError(
        "Batch mode for binary output requires -o <dir> to write files."
      );
    }
    return createBinaryDirectorySink(options.output);
  }

  if (options.output) {
    return createDirectorySink(options.output, { pretty: options.pretty });
  }

  return createNdjsonStdoutSink();
}

/**
 * Drive a batch run end to end: stream inputs from the file, execute each via
 * `scrapeItem` with bounded concurrency, and emit results to the appropriate
 * sink (ndjson stdout by default, or one file per item when `output` is set).
 * Per-item failures are recorded, not fatal; a summary is printed to stderr.
 */
export async function runBatchCommand(
  options: RunBatchCommandOptions
): Promise<BatchSummary> {
  const sink = selectSink(options);
  const items = readInputFile(options.inputFile, {
    inputColumn: options.inputColumn,
  });

  const summary = await runBatch({
    items,
    concurrency: options.concurrency,
    worker: (item) => options.scrapeItem(item.input),
    onResult: (result) => sink.write(result),
  });

  await sink.close?.();

  if (summary.total === 0) {
    throw new ValidationError("Input file produced no inputs.");
  }

  console.error(
    `Batch complete: ${summary.succeeded} succeeded, ${summary.failed} failed (${summary.total} total).`
  );

  return summary;
}
