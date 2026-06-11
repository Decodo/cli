import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BatchResult } from "../types/batch-result.js";
import type { BatchSink } from "../types/batch-sink.js";
import { batchItemFilename } from "./batch-item-filename.js";
import { toBatchRecord } from "./batch-record.js";
import { uniqueName } from "./unique-name.js";

export interface DirectorySinkOptions {
  pretty?: boolean;
}

export function createDirectorySink(
  dir: string,
  options: DirectorySinkOptions = {}
): BatchSink {
  mkdirSync(dir, { recursive: true });
  const used = new Set<string>();
  const indent = options.pretty ? 2 : undefined;

  return {
    write(result: BatchResult): void {
      const base = batchItemFilename(result.input, result.index);
      const name = uniqueName(base, used);
      const record = toBatchRecord(result);
      writeFileSync(
        join(dir, `${name}.json`),
        JSON.stringify(record, null, indent),
        "utf8"
      );
    },
  };
}
