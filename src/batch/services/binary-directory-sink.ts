import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BatchResult } from "../types/batch-result.js";
import type { BatchSink } from "../types/batch-sink.js";
import { batchItemFilename } from "./batch-item-filename.js";
import { toBatchRecord } from "./batch-record.js";
import { uniqueName } from "./unique-name.js";

function isBytes(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

/**
 * Per-item sink for binary (e.g. screenshot) batches: writes `<name>.<ext>` for
 * each successful item and `<name>.error.json` for failures. Used when the
 * target produces binary output, which cannot be streamed as ndjson.
 */
export function createBinaryDirectorySink(
  dir: string,
  extension = "png"
): BatchSink {
  mkdirSync(dir, { recursive: true });
  const used = new Set<string>();

  return {
    write(result: BatchResult): void {
      const name = uniqueName(
        batchItemFilename(result.input, result.index),
        used
      );

      if (result.ok && isBytes(result.data)) {
        writeFileSync(join(dir, `${name}.${extension}`), result.data);
        return;
      }

      writeFileSync(
        join(dir, `${name}.error.json`),
        JSON.stringify(toBatchRecord(result), null, 2),
        "utf8"
      );
    },
  };
}
