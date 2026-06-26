import type { SyncResponse } from "@decodo/sdk-ts";
import { describe, expect, it } from "vitest";
import {
  detectDegradedStatus,
  detectScrapeFailure,
} from "../../../src/output/services/detect-scrape-failure.js";

describe("detectScrapeFailure", () => {
  it("returns undefined for a successful response", () => {
    const response = {
      results: [{ content: { items: [1] }, status_code: 200 }],
    } as SyncResponse;

    expect(detectScrapeFailure(response)).toBeUndefined();
  });

  it("flags a failed content envelope and surfaces its message", () => {
    const response = {
      results: [
        {
          content: {
            status: "failed",
            status_code: 613,
            message: "Trends request was rejected",
          },
        },
      ],
    } as unknown as SyncResponse;

    const failure = detectScrapeFailure(response);

    expect(failure?.message).toBe("Trends request was rejected");
    expect(failure?.statusCode).toBe(613);
  });

  it("flags a failed envelope without a message using its status code", () => {
    const response = {
      results: [{ content: { status: "failed", status_code: 12_002 } }],
    } as unknown as SyncResponse;

    const failure = detectScrapeFailure(response);

    expect(failure?.message).toContain("12002");
    expect(failure?.statusCode).toBe(12_002);
  });

  it("flags an entry whose status code is an HTTP error", () => {
    const response = {
      results: [
        {
          content: { results: [], _warnings: ["not found"] },
          status_code: 404,
        },
      ],
    } as unknown as SyncResponse;

    const failure = detectScrapeFailure(response);

    expect(failure?.message).toContain("404");
    expect(failure?.statusCode).toBe(404);
  });

  it("ignores entries that omit a status code", () => {
    const response = {
      results: [{ content: { ok: true } }],
    } as SyncResponse;

    expect(detectScrapeFailure(response)).toBeUndefined();
  });

  it("does not flag an HTTP error that still returned a body", () => {
    const response = {
      results: [{ content: "<html>404 Not Found</html>", status_code: 404 }],
    } as unknown as SyncResponse;

    expect(detectScrapeFailure(response)).toBeUndefined();
  });

  it("returns the first failure across multiple results", () => {
    const response = {
      results: [
        { content: { ok: true }, status_code: 200 },
        {
          content: {
            status: "failed",
            status_code: 613,
            message: "second failed",
          },
        },
      ],
    } as unknown as SyncResponse;

    expect(detectScrapeFailure(response)?.message).toBe("second failed");
  });
});

describe("detectDegradedStatus", () => {
  it("returns undefined for a successful response", () => {
    const response = {
      results: [{ content: "<html>ok</html>", status_code: 200 }],
    } as unknown as SyncResponse;

    expect(detectDegradedStatus(response)).toBeUndefined();
  });

  it("returns the status code when an HTTP error still returned a body", () => {
    const response = {
      results: [{ content: "<html>404 Not Found</html>", status_code: 404 }],
    } as unknown as SyncResponse;

    expect(detectDegradedStatus(response)).toBe(404);
  });

  it("returns undefined when an HTTP error returned no usable content", () => {
    const response = {
      results: [{ content: { results: [] }, status_code: 404 }],
    } as unknown as SyncResponse;

    expect(detectDegradedStatus(response)).toBeUndefined();
  });
});
