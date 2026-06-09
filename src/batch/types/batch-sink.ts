import type { BatchResult } from "./batch-result.js";

/** Destination for batch results — stdout (ndjson) or a directory of files. */
export interface BatchSink {
  close?(): void | Promise<void>;
  write(result: BatchResult): void | Promise<void>;
}
