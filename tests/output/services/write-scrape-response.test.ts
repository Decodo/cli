import type { SyncResponse } from "@decodo/sdk-ts";
import { BundledSchema } from "@decodo/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeScrapeResponse } from "../../../src/output/services/write-scrape-response.js";

describe("writeScrapeResponse", () => {
  let written: string | undefined;

  beforeEach(() => {
    written = undefined;
    Object.defineProperty(process.stdout, "isTTY", {
      value: false,
      configurable: true,
    });
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written = String(chunk);
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints compact JSON content for parse targets by default", () => {
    const response = {
      results: [{ content: { items: [1] } }],
    } as SyncResponse;

    writeScrapeResponse(response, {
      schema: BundledSchema.shared,
      target: "google_search",
      options: {},
    });

    expect(written).toBe('{"items":[1]}\n');
  });

  it("prints full envelope with --full", () => {
    const response = {
      results: [{ content: "x", status_code: 200 }],
    } as SyncResponse;

    writeScrapeResponse(response, {
      schema: BundledSchema.shared,
      target: "google_search",
      options: { full: true },
    });

    expect(written).toContain('"results"');
    expect(written).toContain('"status_code":200');
  });
});
