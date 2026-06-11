import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ValidationError } from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runBatchCommand } from "../../src/batch/services/run-batch-command.js";
import { CliUsageError } from "../../src/platform/services/handle-cli-error.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "batch-cmd-"));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function writeInput(name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content, "utf8");
  return path;
}

describe("runBatchCommand", () => {
  it("writes one file per item to the output dir, recording failures", async () => {
    const inputFile = writeInput(
      "urls.txt",
      "https://a.com\nhttps://boom.com\nhttps://c.com\n"
    );
    const outDir = join(dir, "out");

    const summary = await runBatchCommand({
      inputFile,
      concurrency: 2,
      output: outDir,
      scrapeItem: (input) => {
        if (input.includes("boom")) {
          return Promise.reject(new ValidationError("kaboom"));
        }
        return Promise.resolve({ url: input });
      },
    });

    expect(summary).toEqual({ total: 3, succeeded: 2, failed: 1 });

    const files = readdirSync(outDir).sort();
    expect(files).toEqual(["a.com.json", "boom.com.json", "c.com.json"]);

    const failure = JSON.parse(
      readFileSync(join(outDir, "boom.com.json"), "utf8")
    );
    expect(failure.error).toEqual({
      class: "ValidationError",
      message: "kaboom",
    });
  });

  it("streams ndjson to stdout when no output dir is given", async () => {
    const inputFile = writeInput("urls.txt", "https://a.com\nhttps://b.com\n");
    const lines: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      lines.push(String(chunk));
      return true;
    });

    await runBatchCommand({
      inputFile,
      concurrency: 4,
      scrapeItem: (input) => Promise.resolve(input),
    });

    expect(lines).toHaveLength(2);
    expect(lines.every((line) => line.endsWith("\n"))).toBe(true);
  });

  it("writes one binary file per item for binary batches", async () => {
    const inputFile = writeInput("urls.txt", "https://a.com\nhttps://b.com\n");
    const outDir = join(dir, "shots");

    const summary = await runBatchCommand({
      inputFile,
      concurrency: 2,
      output: outDir,
      binary: true,
      scrapeItem: (input) => Promise.resolve(Buffer.from(input)),
    });

    expect(summary.succeeded).toBe(2);
    expect(readdirSync(outDir).sort()).toEqual(["a.com.png", "b.com.png"]);
  });

  it("rejects binary batches without an output dir", async () => {
    const inputFile = writeInput("urls.txt", "https://a.com\n");

    await expect(
      runBatchCommand({
        inputFile,
        concurrency: 1,
        binary: true,
        scrapeItem: () => Promise.resolve(Buffer.from([1])),
      })
    ).rejects.toThrow(CliUsageError);
  });

  it("errors when the input file yields no items", async () => {
    const inputFile = writeInput("empty.txt", "\n\n   \n");

    await expect(
      runBatchCommand({
        inputFile,
        concurrency: 1,
        scrapeItem: () => Promise.resolve("x"),
      })
    ).rejects.toThrow(ValidationError);
  });
});
