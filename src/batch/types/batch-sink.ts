import type { BatchResult } from "./batch-result.js";

export interface BatchSink {
  close?(): void | Promise<void>;
  write(result: BatchResult): void | Promise<void>;
}
