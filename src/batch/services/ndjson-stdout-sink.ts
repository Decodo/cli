import type { BatchResult } from "../types/batch-result.js";
import type { BatchSink } from "../types/batch-sink.js";
import { toBatchRecord } from "./batch-record.js";

/**
 * Batch default sink: one JSON record per line on stdout, regardless of TTY.
 */
export function createNdjsonStdoutSink(): BatchSink {
  return {
    write(result: BatchResult): void {
      process.stdout.write(`${JSON.stringify(toBatchRecord(result))}\n`);
    },
  };
}
