import { type SyncResponse, ValidationError } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import { extractPngFromResponse } from "../../../src/scrape/services/extract-png.js";

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0JEQVQImWP4GwADAwEAAv6C7p4AAAAASUVORK5CYII=";

describe("extractPngFromResponse", () => {
  it("decodes base64 PNG from first result", () => {
    const bytes = extractPngFromResponse({
      results: [{ content: MINIMAL_PNG_BASE64 }],
    } as SyncResponse);

    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("throws when results are empty", () => {
    expect(() => extractPngFromResponse({ results: [] })).toThrow(
      ValidationError
    );
  });

  it("throws when content is missing", () => {
    expect(() =>
      extractPngFromResponse({ results: [{ content: "" }] } as SyncResponse)
    ).toThrow(ValidationError);
  });

  it("throws when content is not valid PNG", () => {
    expect(() =>
      extractPngFromResponse({
        results: [{ content: Buffer.from("not-png").toString("base64") }],
      } as SyncResponse)
    ).toThrow(ValidationError);
  });
});
