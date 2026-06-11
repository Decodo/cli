import type { BatchErrorRecord } from "../types/batch-result.js";

export function toErrorRecord(err: unknown): BatchErrorRecord {
  if (err instanceof Error) {
    return {
      class: err.constructor.name || err.name || "Error",
      message: err.message,
    };
  }

  return { class: "Error", message: String(err) };
}
