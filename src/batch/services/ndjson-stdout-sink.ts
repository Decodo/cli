import type { BatchResult } from "../types/batch-result.js";
import type { BatchSink } from "../types/batch-sink.js";
import { toBatchRecord } from "./batch-record.js";

export function createNdjsonStdoutSink(): BatchSink {
  return {
    write(result: BatchResult): void {
      process.stdout.write(`${JSON.stringify(toBatchRecord(result))}\n`);
    },
  };
}
