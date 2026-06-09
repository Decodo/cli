import type { BatchErrorRecord } from "../types/batch-result.js";

/** Normalise any thrown value into a `{ class, message }` error record. */
export function toErrorRecord(err: unknown): BatchErrorRecord {
  if (err instanceof Error) {
    return {
      class: err.constructor.name || err.name || "Error",
      message: err.message,
    };
  }

  return { class: "Error", message: String(err) };
}
