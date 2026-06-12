import { createReadStream } from "node:fs";
import { extname } from "node:path";
import { createInterface } from "node:readline";
import { ValidationError } from "@decodo/sdk-ts";
import { CliUsageError } from "../../platform/services/handle-cli-error.js";
import { CSV_EXTENSION } from "../constants.js";
import type { BatchItem } from "../types/batch-item.js";
import { parseCsvLine } from "./parse-csv-line.js";

export interface ReadInputFileOptions {
  inputColumn?: string;
}

function isCsv(path: string): boolean {
  return extname(path).toLowerCase() === CSV_EXTENSION;
}

function readLines(path: string): AsyncIterable<string> {
  const stream = createReadStream(path, { encoding: "utf8" });
  return createInterface({
    input: stream,
    crlfDelay: Number.POSITIVE_INFINITY,
  });
}

async function* readTxt(path: string): AsyncGenerator<BatchItem> {
  let index = 0;
  for await (const line of readLines(path)) {
    const input = line.trim();
    if (input.length === 0) {
      continue;
    }
    yield { index, input };
    index++;
  }
}

function resolveColumnIndex(header: string[], column: string): number {
  const columnIndex = header.findIndex((name) => name.trim() === column);
  if (columnIndex === -1) {
    throw new ValidationError(
      `Column "${column}" not found in CSV header: ${header.join(", ")}`
    );
  }
  return columnIndex;
}

async function* readCsv(
  path: string,
  column: string
): AsyncGenerator<BatchItem> {
  let columnIndex: number | undefined;
  let index = 0;

  for await (const line of readLines(path)) {
    if (line.trim().length === 0) {
      continue;
    }

    const fields = parseCsvLine(line);

    if (columnIndex === undefined) {
      columnIndex = resolveColumnIndex(fields, column);
      continue;
    }

    const input = fields[columnIndex]?.trim() ?? "";
    if (input.length === 0) {
      continue;
    }

    yield { index, input };
    index++;
  }
}

export function readInputFile(
  path: string,
  options: ReadInputFileOptions = {}
): AsyncGenerator<BatchItem> {
  if (isCsv(path)) {
    if (!options.inputColumn) {
      throw new CliUsageError(
        "--input-column is required when --input-file is a CSV."
      );
    }
    return readCsv(path, options.inputColumn);
  }

  return readTxt(path);
}
