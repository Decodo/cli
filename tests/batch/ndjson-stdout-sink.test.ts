import { afterEach, describe, expect, it, vi } from "vitest";
import { createNdjsonStdoutSink } from "../../src/batch/services/ndjson-stdout-sink.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createNdjsonStdoutSink", () => {
  it("writes one JSON line per result to stdout", () => {
    const lines: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      lines.push(String(chunk));
      return true;
    });

    const sink = createNdjsonStdoutSink();
    sink.write({ index: 0, input: "https://a.com", ok: true, data: { ok: 1 } });
    sink.write({
      index: 1,
      input: "https://b.com",
      ok: false,
      error: { class: "ValidationError", message: "nope" },
    });

    expect(lines).toHaveLength(2);
    expect(lines[0].endsWith("\n")).toBe(true);
    expect(JSON.parse(lines[0])).toEqual({
      index: 0,
      input: "https://a.com",
      result: { ok: 1 },
    });
    expect(JSON.parse(lines[1])).toEqual({
      index: 1,
      input: "https://b.com",
      error: { class: "ValidationError", message: "nope" },
    });
  });
});
