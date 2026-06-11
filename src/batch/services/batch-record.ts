import type { BatchResult } from "../types/batch-result.js";

export interface BatchRecord {
  error?: { class: string; message: string };
  index: number;
  input: string;
  result?: unknown;
}

export function toBatchRecord(result: BatchResult): BatchRecord {
  if (result.ok) {
    return { index: result.index, input: result.input, result: result.data };
  }

  return { index: result.index, input: result.input, error: result.error };
}
