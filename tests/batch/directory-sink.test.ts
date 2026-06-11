import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDirectorySink } from "../../src/batch/services/directory-sink.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "batch-dir-sink-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("createDirectorySink", () => {
  it("writes one record file per item, named from the input", () => {
    const outDir = join(dir, "out");
    const sink = createDirectorySink(outDir);

    sink.write({ index: 0, input: "https://a.com/x", ok: true, data: "A" });
    sink.write({
      index: 1,
      input: "https://b.com",
      ok: false,
      error: { class: "TimeoutError", message: "timed out" },
    });

    const files = readdirSync(outDir).sort();
    expect(files).toEqual(["a.com-x.json", "b.com.json"]);

    const success = JSON.parse(
      readFileSync(join(outDir, "a.com-x.json"), "utf8")
    );
    expect(success).toEqual({
      index: 0,
      input: "https://a.com/x",
      result: "A",
    });

    const failure = JSON.parse(
      readFileSync(join(outDir, "b.com.json"), "utf8")
    );
    expect(failure).toEqual({
      index: 1,
      input: "https://b.com",
      error: { class: "TimeoutError", message: "timed out" },
    });
  });

  it("dedupes colliding names with a numeric suffix", () => {
    const sink = createDirectorySink(dir);

    sink.write({ index: 0, input: "not a url", ok: true, data: 1 });
    sink.write({ index: 0, input: "also not a url", ok: true, data: 2 });

    const files = readdirSync(dir).sort();
    expect(files).toEqual(["item-0-2.json", "item-0.json"]);
  });
});
