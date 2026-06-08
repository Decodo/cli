import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SyncResponse } from "@decodo/sdk-ts";
import { ValidationError } from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeNdjsonResults } from "../../../src/output/services/write-ndjson-results.js";

describe("writeNdjsonResults", () => {
  let written: string[];

  beforeEach(() => {
    written = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits one compact JSON line per result content", () => {
    const response = {
      results: [{ content: { a: 1 } }, { content: { b: 2 } }],
    } as SyncResponse;

    writeNdjsonResults(response, { options: {} });

    expect(written).toEqual(['{"a":1}\n', '{"b":2}\n']);
  });

  it("emits one line for a single result", () => {
    const response = {
      results: [{ content: "hello" }],
    } as SyncResponse;

    writeNdjsonResults(response, { options: {} });

    expect(written).toEqual(['"hello"\n']);
  });

  it("emits full result entries with --full", () => {
    const response = {
      results: [
        { content: "x", status_code: 200 },
        { content: "y", status_code: 201 },
      ],
    } as SyncResponse;

    writeNdjsonResults(response, { options: { full: true } });

    expect(JSON.parse(written[0]?.slice(0, -1) ?? "")).toEqual({
      content: "x",
      status_code: 200,
    });
    expect(JSON.parse(written[1]?.slice(0, -1) ?? "")).toEqual({
      content: "y",
      status_code: 201,
    });
  });

  it("throws when results are empty", () => {
    expect(() =>
      writeNdjsonResults({ results: [] } as SyncResponse, { options: {} })
    ).toThrow(ValidationError);
  });

  it("throws when content is missing", () => {
    const response = {
      results: [{ content: { ok: true } }, { content: null }],
    } as SyncResponse;

    expect(() => writeNdjsonResults(response, { options: {} })).toThrow(
      ValidationError
    );
  });

  it("writes all lines to file when -o is set", () => {
    const dir = mkdtempSync(join(tmpdir(), "decodo-ndjson-"));
    const path = join(dir, "out.ndjson");

    try {
      const response = {
        results: [{ content: { a: 1 } }, { content: { b: 2 } }],
      } as SyncResponse;

      writeNdjsonResults(response, { options: { output: path } });

      expect(readFileSync(path, "utf8")).toBe('{"a":1}\n{"b":2}\n');
      expect(written).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
