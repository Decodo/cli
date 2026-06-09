import type { BatchItem } from "./batch-item.js";

export interface BatchErrorRecord {
  /** Error class name, e.g. "ValidationError". */
  class: string;
  message: string;
}

export interface BatchSuccess extends BatchItem {
  data: unknown;
  ok: true;
}

export interface BatchFailure extends BatchItem {
  error: BatchErrorRecord;
  ok: false;
}

export type BatchResult = BatchSuccess | BatchFailure;

export interface BatchSummary {
  failed: number;
  succeeded: number;
  total: number;
}
