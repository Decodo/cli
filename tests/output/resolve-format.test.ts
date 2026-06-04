import { BundledSchema } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import {
  resolveDefaultFormat,
  resolveOutputFormat,
} from "../../src/output/resolve-format.js";

const schema = BundledSchema.shared;

describe("resolveDefaultFormat", () => {
  it("defaults parse-enabled targets to json", () => {
    expect(resolveDefaultFormat("google_search", schema)).toBe("json");
  });

  it("defaults universal to markdown", () => {
    expect(resolveDefaultFormat("universal", schema)).toBe("markdown");
  });
});

describe("resolveOutputFormat", () => {
  it("honours --format html", () => {
    expect(
      resolveOutputFormat({ format: "html" }, "google_search", schema)
    ).toBe("html");
  });

  it("honours --json shortcut", () => {
    expect(resolveOutputFormat({ json: true }, "universal", schema)).toBe(
      "json"
    );
  });

  it("prefers explicit --format over --json", () => {
    expect(
      resolveOutputFormat(
        { format: "raw", json: true },
        "google_search",
        schema
      )
    ).toBe("raw");
  });
});
