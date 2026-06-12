import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ValidationError } from "@decodo/sdk-ts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readInputFile } from "../../src/batch/services/read-input-file.js";
import type { BatchItem } from "../../src/batch/types/batch-item.js";
import { CliUsageError } from "../../src/platform/services/handle-cli-error.js";

let dir: string;

function writeFixture(name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content, "utf8");
  return path;
}

async function collect(
  iterable: AsyncIterable<BatchItem>
): Promise<BatchItem[]> {
  const items: BatchItem[] = [];
  for await (const item of iterable) {
    items.push(item);
  }
  return items;
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "batch-input-"));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("readInputFile (.txt)", () => {
  it("yields one trimmed input per non-empty line", async () => {
    const path = writeFixture(
      "urls.txt",
      "https://a.com\n  https://b.com  \n\n\nhttps://c.com\n"
    );

    const items = await collect(readInputFile(path));

    expect(items).toEqual([
      { index: 0, input: "https://a.com" },
      { index: 1, input: "https://b.com" },
      { index: 2, input: "https://c.com" },
    ]);
  });
});

describe("readInputFile (.csv)", () => {
  it("extracts the named column and skips the header", async () => {
    const path = writeFixture(
      "input.csv",
      "id,url,note\n1,https://a.com,first\n2,https://b.com,second\n"
    );

    const items = await collect(readInputFile(path, { inputColumn: "url" }));

    expect(items).toEqual([
      { index: 0, input: "https://a.com" },
      { index: 1, input: "https://b.com" },
    ]);
  });

  it("requires --input-column for CSV input", () => {
    const path = writeFixture("missing-column.csv", "url\nhttps://a.com\n");

    expect(() => readInputFile(path)).toThrow(CliUsageError);
  });

  it("throws when the named column is absent from the header", async () => {
    const path = writeFixture("bad-header.csv", "id,note\n1,first\n");

    await expect(
      collect(readInputFile(path, { inputColumn: "url" }))
    ).rejects.toThrow(ValidationError);
  });
});
