import { describe, expect, it } from "vitest";
import { parseCsvLine } from "../../src/batch/services/parse-csv-line.js";

describe("parseCsvLine", () => {
  it("splits a plain comma-separated line", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("preserves commas inside quoted fields", () => {
    expect(parseCsvLine('"https://x.com/?a=1,2",b')).toEqual([
      "https://x.com/?a=1,2",
      "b",
    ]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    expect(parseCsvLine('"say ""hi""",next')).toEqual(['say "hi"', "next"]);
  });

  it("keeps empty trailing and leading fields", () => {
    expect(parseCsvLine(",a,")).toEqual(["", "a", ""]);
  });
});
